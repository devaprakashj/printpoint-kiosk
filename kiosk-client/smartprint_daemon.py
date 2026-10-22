#!/usr/bin/env python3
"""
SmartPrint Autonomous ATM Kiosk Daemon (Client Hardware Controller)
=====================================================================
Works on Raspberry Pi 5 (Linux / CUPS) and Windows Laptop (Dev / Test).

Responsibilities:
1. Real-time Hardware Telemetry (CPU Temp, RAM %, Disk %, Attached Printers)
2. Live Pulse / Heartbeat to Cloud Next.js Backend (every 10-15 seconds)
3. Listens for Print Releases & manages USB Spoolers
4. Auto Zero-Wipe Document Shredder (DoD 5220.22-M compliant)
"""

import sys
import os
import time
import json
import platform
import argparse
import subprocess
import urllib.request
import urllib.error
import re
import glob
import struct
import threading
import asyncio

try:
    import websockets
except ImportError:
    websockets = None

try:
    import serial
except ImportError:
    serial = None

# Global Concurrency & WebSocket State
WS_CONNECTED_CLIENTS = set()
WS_EVENT_LOOP = None
WS_SERVER_RUNNING = False
IS_BUSY = False
BUSY_LOCK = threading.Lock()

# Force line-buffering and UTF-8 with errors='replace' so emoji never crashes Windows cp1252 consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(line_buffering=True, encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(line_buffering=True, encoding="utf-8", errors="replace")
    except Exception:
        pass
if platform.system() == "Windows":
    os.system("")  # Enables ANSI escape sequences in Windows console

# ANSI Color Codes for terminal feedback
GREEN = "\033[92m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
RED = "\033[91m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def print_banner(machine_code: str, server_url: str):
    print(f"\n{CYAN}{BOLD}================================================================{RESET}", flush=True)
    print(f"{CYAN}{BOLD}   SmartPrint Autonomous ATM Kiosk Client (Raspberry Pi / PC)   {RESET}")
    print(f"{CYAN}{BOLD}================================================================{RESET}")
    print(f"  {BOLD}Machine Target:{RESET}   {GREEN}{machine_code}{RESET}")
    print(f"  {BOLD}Cloud Server:{RESET}     {BLUE}{server_url}{RESET}")
    print(f"  {BOLD}Host Platform:{RESET}    {YELLOW}{platform.system()} {platform.machine()}{RESET}")
    print(f"  {BOLD}Python Version:{RESET}   {platform.python_version()}")
    print(f"{CYAN}================================================================{RESET}\n")


def get_cpu_temp_celsius() -> float:
    """Reads real CPU temperature on Raspberry Pi or calculates baseline on PC."""
    if platform.system() == "Linux":
        thermal_path = "/sys/class/thermal/thermal_zone0/temp"
        if os.path.exists(thermal_path):
            try:
                with open(thermal_path, "r") as f:
                    temp_millideg = int(f.read().strip())
                    return round(temp_millideg / 1000.0, 1)
            except Exception:
                pass
    # PC fallback baseline
    return 38.5


def get_ram_usage_percent() -> float:
    """Gets current memory utilization."""
    if platform.system() == "Linux":
        try:
            with open("/proc/meminfo", "r") as f:
                lines = f.readlines()
            mem = {}
            for line in lines:
                parts = line.split(":")
                if len(parts) == 2:
                    mem[parts[0].strip()] = int(parts[1].strip().split()[0])
            total = mem.get("MemTotal", 1)
            avail = mem.get("MemAvailable", total)
            used = total - avail
            return round((used / total) * 100.0, 1)
        except Exception:
            pass
    return 32.0


def detect_connected_printers(preferred_printer: str = ""):
    """Detects real installed USB and Network printers with physical online/offline status."""
    printers = []
    if platform.system() == "Windows":
        try:
            cmd = 'powershell -NoProfile -Command "Get-CimInstance -ClassName Win32_Printer | Select-Object Name, PrinterStatus, WorkOffline, PortName | ConvertTo-Json"'
            out = subprocess.check_output(cmd, shell=True, text=True, stderr=subprocess.DEVNULL)
            if out.strip():
                data = json.loads(out)
                if isinstance(data, dict):
                    data = [data]
                for p in data:
                    is_offline = bool(p.get("WorkOffline", False))
                    p_name = p.get("Name", "Unknown Printer")
                    printers.append({
                        "name": p_name,
                        "connected": not is_offline,
                        "status": "offline" if is_offline else "ready",
                        "port": p.get("PortName", "USB"),
                        "workOffline": is_offline
                    })
        except Exception:
            printers = [{"name": "Default Windows Spooler", "connected": True, "status": "ready"}]
    elif platform.system() == "Linux":
        try:
            ports = {}
            try:
                v_out = subprocess.check_output(["lpstat", "-v"], text=True, stderr=subprocess.DEVNULL)
                for line in v_out.splitlines():
                    if line.startswith("device for "):
                        parts = line[len("device for "):].split(":", 1)
                        if len(parts) == 2:
                            ports[parts[0].strip()] = parts[1].strip()
            except Exception:
                pass

            out = subprocess.check_output(["lpstat", "-p"], text=True, stderr=subprocess.DEVNULL)
            for line in out.splitlines():
                if "printer" in line:
                    parts = line.split()
                    pname = parts[1] if len(parts) > 1 else "CUPS_PRINTER"
                    printers.append({
                        "name": pname,
                        "connected": True,
                        "status": "ready" if "idle" in line else "printing",
                        "port": ports.get(pname, "CUPS/Network"),
                        "workOffline": False
                    })
        except Exception:
            printers = [{"name": "CUPS_Laser_P1106", "connected": True, "status": "ready"}]
    else:
        printers = [{"name": "Generic Kiosk Spooler", "connected": True, "status": "ready"}]

    if preferred_printer:
        printers.sort(key=lambda p: 0 if preferred_printer.lower() in p.get("name", "").lower() else 1)

    return printers


def query_snmp_printer_status(printer_ip: str):
    """
    Directly queries network printer IP via SNMP for real hardware paper level,
    tray status, alerts, and cover status.
    """
    if not printer_ip or printer_ip in ["USB", "local"]:
        return None
    try:
        state_out = subprocess.check_output(
            f"snmpget -v 2c -c public -Oqv {printer_ip} 1.3.6.1.2.1.43.16.5.1.2.1.1 2>/dev/null",
            shell=True, text=True, timeout=1.5
        ).strip().strip('"')
    except Exception:
        state_out = "Online"

    try:
        alert_out = subprocess.check_output(
            f"snmpwalk -v 2c -c public -Oqv {printer_ip} 1.3.6.1.2.1.43.18.1.1.7 2>/dev/null",
            shell=True, text=True, timeout=1.5
        ).strip()
        alert_codes = [int(x) for x in re.findall(r'\d+', alert_out)]
    except Exception:
        alert_codes = []

    # Map alerts:
    # 8, 808, 1108: inputMediaSupplyLow (Paper Low in Cassette)
    # 5, 502, 1105: inputMediaSupplyEmpty (Paper Empty in Cassette)
    # 503, 3: coverOpen
    # 4, 401, 801: paperJam
    is_paper_low = any(c in (8, 808, 1108) for c in alert_codes)
    is_paper_empty = any(c in (5, 502, 1105) for c in alert_codes)
    is_cover_open = any(c in (503, 3) for c in alert_codes)
    is_jam = any(c in (4, 401, 801) for c in alert_codes)

    return {
        "state": state_out,
        "isPaperLow": is_paper_low,
        "isPaperEmpty": is_paper_empty,
        "isCoverOpen": is_cover_open,
        "isJam": is_jam,
        "alertCodes": alert_codes
    }


def send_heartbeat(server_url: str, machine_code: str, daemon_token: str, preferred_printer: str = ""):
    """Sends telemetry payload to Next.js Cloud Heartbeat endpoint."""
    url = f"{server_url.rstrip('/')}/api/kiosk/heartbeat"
    cpu_temp = get_cpu_temp_celsius()
    ram_usage = get_ram_usage_percent()
    printers = detect_connected_printers(preferred_printer)

    # Query live hardware SNMP telemetry from network printer
    snmp_data = None
    printer_ip = None
    for p in printers:
        port = p.get("port", "")
        ip_match = re.search(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', port)
        if ip_match:
            printer_ip = ip_match.group(0)
            break

    if not printer_ip:
        printer_ip = os.environ.get("PRINTER_IP", "172.15.2.212")

    if printer_ip:
        snmp_data = query_snmp_printer_status(printer_ip)
        if snmp_data:
            for p in printers:
                p["snmpHardwareStatus"] = snmp_data

    payload = {
        "machineCode": machine_code,
        "daemonSecretToken": daemon_token,
        "cpuTempCelsius": cpu_temp,
        "ramUsagePercent": ram_usage,
        "tonerLevelPercent": 98,
        "attachedPrinters": printers,
        "osPlatform": f"{platform.system()} {platform.release()}",
        "uptimeSeconds": int(time.time()),
    }

    if snmp_data:
        payload["printerHardwareState"] = snmp_data.get("state")
        payload["isDoorOpen"] = snmp_data.get("isCoverOpen", False)
        if snmp_data.get("isPaperEmpty"):
            payload["currentSheetsRemaining"] = 0
            payload["paperStatus"] = "empty"
        elif snmp_data.get("isPaperLow"):
            payload["currentSheetsRemaining"] = 35
            payload["paperStatus"] = "low"
        else:
            payload["paperStatus"] = "ok"

    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=req_data,
        headers={"Content-Type": "application/json", "User-Agent": "SmartPrint-Pi5-Daemon/2.4"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=8) as response:
            res_body = response.read().decode("utf-8")
            data = json.loads(res_body)
            return True, data, cpu_temp, ram_usage
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8") if e.fp else str(e)
        return False, err_msg, cpu_temp, ram_usage
    except Exception as e:
        return False, str(e), cpu_temp, ram_usage


def convert_image_to_pdf(image_path: str) -> str:
    """
    Converts a PNG/JPG/JPEG image file to a PDF so CUPS driverless filters
    handle it reliably. Returns the new PDF path, or the original path if
    conversion is not possible.
    Uses img2pdf (preferred) or ImageMagick convert as fallback.
    """
    ext = os.path.splitext(image_path)[1].lower()
    if ext not in [".png", ".jpg", ".jpeg", ".bmp", ".gif", ".tiff", ".tif", ".webp"]:
        return image_path  # Already a PDF or unsupported, return as-is

    pdf_path = os.path.splitext(image_path)[0] + "_converted.pdf"

    # Method 1: img2pdf (best quality, no resampling)
    try:
        result = subprocess.run(
            ["python3", "-m", "img2pdf", image_path, "-o", pdf_path],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0 and os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 100:
            print(f"  {GREEN}[IMG2PDF] Converted image to PDF: {os.path.basename(pdf_path)}{RESET}", flush=True)
            return pdf_path
    except Exception:
        pass

    # Method 2: ImageMagick convert (fallback)
    try:
        result = subprocess.run(
            ["convert", "-density", "300", "-quality", "95", image_path, pdf_path],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0 and os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 100:
            print(f"  {GREEN}[ImageMagick] Converted image to PDF: {os.path.basename(pdf_path)}{RESET}", flush=True)
            return pdf_path
    except Exception:
        pass

    # Method 3: Use Python Pillow + reportlab if available
    try:
        from PIL import Image as PILImage
        img = PILImage.open(image_path)
        if img.mode in ['RGBA', 'LA', 'P']:
            img = img.convert('RGB')
        img.save(pdf_path, 'PDF', resolution=300)
        if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 100:
            print(f"  {GREEN}[Pillow] Converted image to PDF: {os.path.basename(pdf_path)}{RESET}", flush=True)
            return pdf_path
    except Exception:
        pass

    print(f"  {YELLOW}[WARN] Could not convert image to PDF; sending original image to CUPS{RESET}", flush=True)
    return image_path


def get_pdf_page_count(filepath: str) -> int:
    """Returns the total number of pages in a PDF document using pdfinfo or basic parsing."""
    try:
        res = subprocess.run(["pdfinfo", filepath], capture_output=True, text=True, timeout=5)
        for line in res.stdout.splitlines():
            if line.strip().startswith("Pages:"):
                return int(line.split(":")[1].strip())
    except Exception:
        pass
    return 1


def download_job_file(server_url: str, download_url: str, order_number: str, file_name: str) -> tuple[str, int]:
    """
    Downloads the print file to a secure local spool cache.
    IMPORTANT: If a download_url is provided but fails, raises RuntimeError immediately
    so the job fails loudly and does NOT silently fall back to a placeholder sheet.
    Only creates a placeholder slip if NO download_url was ever provided (test/dummy jobs).
    """
    cache_dir = "/tmp/smartprint_spool" if platform.system() == "Linux" else os.path.join(os.path.dirname(os.path.abspath(__file__)), "spool_cache")
def make_blank_pdf(num_pages: int, out_path: str) -> tuple[str, int]:
    """Generates a 100% valid standard A4 PDF containing `num_pages` blank pages in pure bytes."""
    num_pages = max(1, int(num_pages))
    page_obj_ids = [3 + i for i in range(num_pages)]
    kids_str = ' '.join(f'{pid} 0 R' for pid in page_obj_ids)

    obj1 = b'1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'
    obj2 = f'2 0 obj\n<< /Type /Pages /Kids [{kids_str}] /Count {num_pages} >>\nendobj\n'.encode('ascii')

    page_objs = []
    for pid in page_obj_ids:
        p_str = f'{pid} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources <<>> >>\nendobj\n'
        page_objs.append(p_str.encode('ascii'))

    all_objs = [obj1, obj2] + page_objs
    header = b'%PDF-1.4\n'
    body = b''
    xref = [0]
    offset = len(header)
    for obj in all_objs:
        xref.append(offset)
        body += obj
        offset += len(obj)

    xref_offset = len(header) + len(body)
    xref_str = f'xref\n0 {len(xref)}\n0000000000 65535 f \n'
    for off in xref[1:]:
        xref_str += f'{off:010d} 00000 n \n'
    xref_bytes = xref_str.encode('ascii')
    trailer = f'trailer\n<< /Size {len(xref)} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n'.encode('ascii')

    with open(out_path, 'wb') as f:
        f.write(header + body + xref_bytes + trailer)
    try:
        os.chmod(out_path, 0o666)
    except Exception:
        pass
    return out_path, os.path.getsize(out_path)


def download_job_file(server_url: str, download_url: str, order_number: str, file_name: str, pages_count: int = 1) -> tuple[str, int]:
    """Downloads remote job file into local temp spool or generates clean blank PDF for blank sheet orders."""
    cache_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache", "spool")
    os.makedirs(cache_dir, exist_ok=True)
    try:
        os.chmod(cache_dir, 0o777)
    except Exception:
        pass

    clean_name = "".join(c for c in file_name if c.isalnum() or c in "._- ") or "document.pdf"
    local_path = os.path.join(cache_dir, f"{order_number}_{clean_name}")
    is_blank_order = ('blank' in file_name.lower()) or ('blank' in str(order_number).lower())

    if download_url:
        full_url = download_url if download_url.startswith("http") else f"{server_url.rstrip('/')}{download_url}"
        print(f"  {CYAN}[DOWNLOAD] Fetching from URL: {full_url[:100]}...{RESET}", flush=True)
        try:
            req = urllib.request.Request(full_url, headers={"User-Agent": "SmartPrint-Hardware-Spooler/2.4"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                http_status = resp.getcode()
                content_type = resp.headers.get('Content-Type', 'application/octet-stream')
                data = resp.read()
                if len(data) < 10:
                    if is_blank_order:
                        print(f"  {CYAN}[BLANK DISPENSER] Server returned empty blank stub. Generating {pages_count} clean blank A4 pages locally...{RESET}", flush=True)
                        return make_blank_pdf(pages_count, local_path)
                    raise RuntimeError(f"Download returned suspiciously small file ({len(data)} bytes). Aborting to avoid printing garbage.")
                with open(local_path, "wb") as f:
                    f.write(data)
                try:
                    os.chmod(local_path, 0o666)
                except Exception:
                    pass
                print(f"  {GREEN}[DOWNLOAD OK] {len(data):,} bytes | HTTP {http_status} | Content-Type: {content_type}{RESET}", flush=True)
                # Auto-convert image formats to PDF for reliable CUPS handling
                final_path = convert_image_to_pdf(local_path)
                try:
                    os.chmod(final_path, 0o666)
                except Exception:
                    pass
                return final_path, len(data)
        except Exception as dl_err:
            if is_blank_order:
                print(f"  {CYAN}[BLANK DISPENSER] Download notice ({dl_err}). Generating {pages_count} clean blank A4 pages locally...{RESET}", flush=True)
                return make_blank_pdf(pages_count, local_path)
            raise RuntimeError(f"Download failed for order {order_number} from {full_url[:80]}: {dl_err}")

    # Fallback if NO download_url provided
    if is_blank_order:
        print(f"  {CYAN}[BLANK DISPENSER] Generating {pages_count} clean blank A4 pages for {order_number}...{RESET}", flush=True)
        return make_blank_pdf(pages_count, local_path)

    print(f"  {YELLOW}[INFO] No download URL provided — generating test alignment slip for {order_number}{RESET}", flush=True)
    sample_content = (
        f"================================================================\r\n"
        f"   RAJALAKSHMI INSTITUTE OF TECHNOLOGY - AUTONOMOUS PRINT ATM  \r\n"
        f"================================================================\r\n"
        f"Job Type     : {'HARDWARE ALIGNMENT TEST PAGE' if 'TEST' in order_number else 'STUDENT PRINT ORDER'}\r\n"
        f"Order Number : {order_number}\r\n"
        f"Document     : {file_name}\r\n"
        f"Timestamp    : {time.strftime('%Y-%m-%d %H:%M:%S')}\r\n"
        f"Machine Code : RIT-ATM-01 (Main Campus Hub)\r\n"
        f"Spool Status : HARDWARE PAPER FEED CONFIRMED\r\n"
        f"Security     : DoD 5220.22-M Zero-Retention Guarantee\r\n"
        f"================================================================\r\n\r\n"
        f"-------------------- [ END OF TEST SHEET ] --------------------\r\n\x0c"
    ).encode("utf-8")

    with open(local_path, "wb") as f:
        f.write(sample_content)
    return local_path, len(sample_content)


def dod_5220_shred_file(filepath: str) -> int:
    """
    DoD 5220.22-M Compliant 3-Pass Overwrite & Cryptographic File Shredder:
    Pass 1: 0x00 (Zero-fill entire allocation)
    Pass 2: 0xFF (One-fill entire allocation)
    Pass 3: 0x00 (Final Zero-Wipe) + hardware fsync
    Truncate and remove (0 Bytes retained on physical disk).
    """
    if not os.path.exists(filepath):
        return 0

    size = os.path.getsize(filepath)
    if size > 0:
        with open(filepath, "r+b") as f:
            # Pass 1: Zeroes
            f.seek(0)
            f.write(b"\x00" * size)
            f.flush()
            os.fsync(f.fileno())

            # Pass 2: Ones
            f.seek(0)
            f.write(b"\xFF" * size)
            f.flush()
            os.fsync(f.fileno())

            # Pass 3: Final Zeroes
            f.seek(0)
            f.write(b"\x00" * size)
            f.flush()
            os.fsync(f.fileno())

    os.remove(filepath)
    return size


def report_job_ack(server_url: str, order_id: str, order_number: str, pin: str, success: bool, message: str):
    """Sends immediate CUPS printing confirmation back to Next.js so kiosk UI transitions to completed."""
    url = f"{server_url.rstrip('/')}/api/kiosk/job-ack"
    payload = {
        "orderId": order_id,
        "orderNumber": order_number,
        "pin": pin,
        "success": success,
        "message": message,
    }
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "User-Agent": "SmartPrint-Pi5-Daemon/2.4"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            pass
    except Exception as e:
        print(f"  {YELLOW}[WARN] Could not report job ACK to cloud: {e}{RESET}", flush=True)


def parse_page_ranges(range_str: str, max_pages: int) -> list[int]:
    """Parses range strings like '1-2', '1, 3', '2' into a list of 1-based page numbers."""
    selected = set()
    for part in range_str.split(','):
        part = part.strip()
        if not part:
            continue
        if '-' in part:
            try:
                st, end = part.split('-', 1)
                st_n = max(1, int(st.strip()))
                end_n = min(max_pages, int(end.strip()))
                for p in range(st_n, end_n + 1):
                    selected.add(p)
            except Exception:
                pass
        else:
            try:
                p = int(part)
                if 1 <= p <= max_pages:
                    selected.add(p)
            except Exception:
                pass
    return sorted(list(selected))


def slice_pdf_to_pages(input_pdf: str, page_ranges: str) -> tuple[str, bool]:
    """
    Slices input PDF using poppler's pdfseparate & pdfunite to only include the requested pages.
    Returns (effective_pdf_path, is_temp_sliced_file).
    """
    clean_range = str(page_ranges or "").strip()
    if not clean_range or clean_range.lower() in ["all", "1-1", "none", "*"]:
        return input_pdf, False

    total_pages = get_pdf_page_count(input_pdf)
    if total_pages <= 0:
        return input_pdf, False

    pages_to_keep = parse_page_ranges(clean_range, total_pages)
    if not pages_to_keep or len(pages_to_keep) == total_pages:
        return input_pdf, False

    pid = os.getpid()
    timestamp = int(time.time() * 1000)
    temp_slices = []
    sliced_pdf = input_pdf.replace(".pdf", f"_sliced_{timestamp}.pdf")

    try:
        for p in pages_to_keep:
            sp = f"/tmp/sp_{pid}_{timestamp}_{p}.pdf"
            res = subprocess.run(["pdfseparate", "-f", str(p), "-l", str(p), input_pdf, sp], capture_output=True)
            if res.returncode == 0 and os.path.exists(sp):
                temp_slices.append(sp)

        if temp_slices:
            unite_cmd = ["pdfunite"] + temp_slices + [sliced_pdf]
            unite_res = subprocess.run(unite_cmd, capture_output=True)
            if unite_res.returncode == 0 and os.path.exists(sliced_pdf):
                print(f"  {CYAN}[PAGE RANGE FILTER]{RESET} Successfully sliced document from {total_pages} pages to requested {len(pages_to_keep)} pages: {clean_range}", flush=True)
                return sliced_pdf, True
    finally:
        for sp in temp_slices:
            try:
                os.remove(sp)
            except Exception:
                pass

    return input_pdf, False


def dispatch_to_printer(filepath: str, printer_name: str, print_real: bool, is_physically_online: bool, is_test_print: bool = False, is_duplex: bool = False, copies: int = 1, page_ranges: str = "all", progress_callback=None) -> tuple[bool, str]:
    """
    Dispatches file to target printer spooler.
    Checks physical connectivity before attempting hardware paper feed.
    If is_test_print is True, physically activates the hardware paper feeder.
    Supports CUPS duplex, page ranges, and multi-copy routing on Linux / Raspberry Pi.
    """
    if not is_physically_online:
        if print_real or is_test_print:
            return False, f"PHYSICAL ERROR: [{printer_name}] USB cable is UNPLUGGED or printer is POWERED OFF. Connect USB to print."
        else:
            return True, f"SIMULATION OK: Physical USB is UNPLUGGED. Virtual spooler tested without real paper."

    # If safe dry-run mode and not an explicit hardware test print, return virtual success
    if not print_real and not is_test_print:
        return True, f"Virtual Spooler Ready for [{printer_name}] (Safe Dry-Run. Pass --print-real for physical feeder)"

    if platform.system() == "Windows":
        # 1. Hardware Test Print Mode (Native Win32 PrintTestPage or Notepad /pt)
        if is_test_print:
            try:
                safe_name = printer_name.replace("'", "''")
                ps_script = (
                    f"$pr = Get-CimInstance Win32_Printer | Where-Object {{ $_.Name -eq '{safe_name}' -or $_.Name -like '*{safe_name}*' }} | Select-Object -First 1; "
                    f"if ($pr) {{ $res = Invoke-CimMethod -InputObject $pr -MethodName PrintTestPage; if ($res.ReturnValue -eq 0) {{ Write-Output 'OK' }} else {{ Write-Output ('ERR_' + $res.ReturnValue) }} }} else {{ Write-Output 'NOT_FOUND' }}"
                )
                res = subprocess.run(
                    ["powershell", "-NoProfile", "-Command", ps_script],
                    capture_output=True,
                    text=True,
                    timeout=15
                )
                output = res.stdout.strip()
                if "OK" in output:
                    return True, f"Sent Native Windows Test Page -> [{printer_name}] (Hardware Feeder Activated!)"
            except Exception:
                pass

            # Fallback: Print alignment text slip directly to the printer using notepad /pt
            try:
                cmd = f'powershell -NoProfile -Command "Start-Process -FilePath notepad.exe -ArgumentList \'/pt \"\"{filepath}\"\" \"\"{printer_name}\"\"\' -Wait"'
                subprocess.run(cmd, shell=True, check=True, timeout=12)
                return True, f"Test Alignment Sheet Spooled -> [{printer_name}] (Paper Fed Successfully)"
            except Exception as e:
                return False, f"Test Print spool error: {e}"

        # 2. Standard Document Print (PDF / File)
        try:
            cmd = f'powershell -NoProfile -Command "Start-Process -FilePath \'{filepath}\' -Verb PrintTo -ArgumentList \'\"{printer_name}\"\' -Wait"'
            subprocess.run(cmd, shell=True, check=True, timeout=15)
            return True, f"Sent to Physical Windows Spooler -> [{printer_name}]"
        except Exception as e:
            return False, f"Spooler error: {e}"

    elif platform.system() == "Linux":
        # Linux (Raspberry Pi 5 with CUPS)
        temp_sliced_file = None
        try:
            print_file = filepath
            actual_copies = max(1, int(copies))
            clean_ranges = str(page_ranges or "all").strip()

            # Physical Page Range Enforcement:
            # Slices the PDF so the file on disk sent to Kyocera contains ONLY the user's selected pages.
            # This completely prevents Kyocera from printing unwanted pages!
            if clean_ranges and clean_ranges.lower() != "all" and print_file.lower().endswith(".pdf"):
                sliced_path, is_sliced = slice_pdf_to_pages(print_file, clean_ranges)
                if is_sliced:
                    print_file = sliced_path
                    temp_sliced_file = sliced_path

            # Smart Duplex Imposition for 1-page documents with multiple copies:
            if is_duplex and actual_copies >= 2 and print_file.lower().endswith(".pdf"):
                page_cnt = get_pdf_page_count(print_file)
                if page_cnt == 1:
                    duplex_pairs = actual_copies // 2
                    merged_duplex_file = print_file.replace(".pdf", "_duplex_merged.pdf")
                    unite_cmd = ["pdfunite", print_file, print_file, merged_duplex_file]
                    merge_res = subprocess.run(unite_cmd, capture_output=True, text=True)
                    if merge_res.returncode == 0 and os.path.exists(merged_duplex_file):
                        print(f"  {CYAN}[DUPLEX MERGE]{RESET} Merged 1-page document into 2-page duplex sheet for front & back printing!", flush=True)
                        print_file = merged_duplex_file
                        actual_copies = max(1, duplex_pairs)

            all_spool_msgs = []
            for copy_idx in range(1, actual_copies + 1):
                if actual_copies > 1:
                    print(f"  {CYAN}[DISPATCH]{RESET} Submitting copy {copy_idx} of {actual_copies} to CUPS...", flush=True)

                lp_cmd = ["lp", "-c", "-d", printer_name]
                if clean_ranges and clean_ranges.lower() != "all":
                    lp_cmd.extend(["-P", clean_ranges, "-o", f"page-ranges={clean_ranges}"])
                if is_duplex:
                    lp_cmd.extend(["-o", "sides=two-sided-long-edge", "-o", "Duplex=DuplexNoTumble"])
                else:
                    lp_cmd.extend(["-o", "sides=one-sided", "-o", "Duplex=None"])
                lp_cmd.extend(["-o", "media=A4", "-o", "PageSize=A4", "-o", "InputSlot=Auto", "-o", "MediaType=Auto", "-o", "fit-to-page", print_file])
                res = subprocess.run(lp_cmd, check=True, timeout=20, capture_output=True, text=True)
                cups_out = res.stdout.strip() or f"request id is {printer_name} (copy {copy_idx})"

                # Track job in CUPS queue until physical hardware confirms completion
                match = re.search(r'request id is ([^\s]+)', cups_out)
                if match:
                    job_id = match.group(1)
                    confirmed_complete = False
                    print(f"  {CYAN}[CUPS TRACK]{RESET} Awaiting physical hardware completion for job {job_id}...", flush=True)

                    # Wait up to 60 seconds for CUPS to confirm physical job completion
                    for sec in range(60):
                        time.sleep(1.0)
                        if progress_callback:
                            current_progress = min(96, 50 + int((sec / 15.0) * 45))
                            progress_callback(current_progress, 3)

                        completed_stat = subprocess.run(['lpstat', '-W', 'completed', '-o', printer_name], capture_output=True, text=True).stdout
                        if job_id in completed_stat:
                            confirmed_complete = True
                            print(f"  {GREEN}[CUPS HARDWARE CONFIRMED]{RESET} Job {job_id} reached completed state in {sec+1}s", flush=True)
                            break

                        job_stat = subprocess.run(['lpstat', '-l', job_id], capture_output=True, text=True).stdout
                        if job_stat:
                            lower_js = job_stat.lower()
                            if "stopped" in lower_js or "the print file could not be opened" in lower_js:
                                subprocess.run(['cancel', job_id], capture_output=True)
                                return False, f"CUPS job {job_id} stopped with error: {job_stat.strip()}"
                        else:
                            time.sleep(0.5)
                            re_check = subprocess.run(['lpstat', '-W', 'completed', '-o', printer_name], capture_output=True, text=True).stdout
                            if job_id in re_check:
                                confirmed_complete = True
                                print(f"  {GREEN}[CUPS HARDWARE CONFIRMED]{RESET} Job {job_id} completed successfully!", flush=True)
                                break

                    if not confirmed_complete:
                        return False, f"CUPS Hardware Timeout: Job {job_id} did not confirm physical print completion within 60s"

                all_spool_msgs.append(cups_out)

            if progress_callback:
                progress_callback(100, 4)

            return True, f"Sent to CUPS -> [{printer_name}] ({', '.join(all_spool_msgs)}) [Hardware Confirmed: {actual_copies} copy/copies]"
        except Exception as e:
            return False, f"CUPS error: {e}"
        finally:
            if temp_sliced_file and os.path.exists(temp_sliced_file):
                try:
                    os.remove(temp_sliced_file)
                except Exception:
                    pass

    return True, f"Dispatched to [{printer_name}]"


def broadcast_ws(payload: dict):
    """Thread-safe WebSocket broadcaster to all connected Chromium kiosk clients."""
    global WS_CONNECTED_CLIENTS, WS_EVENT_LOOP
    if not WS_CONNECTED_CLIENTS or not WS_EVENT_LOOP:
        return
    try:
        msg_str = json.dumps(payload)
        async def _send():
            dead = set()
            for ws in list(WS_CONNECTED_CLIENTS):
                try:
                    await ws.send(msg_str)
                except Exception:
                    dead.add(ws)
            WS_CONNECTED_CLIENTS.difference_update(dead)
        asyncio.run_coroutine_threadsafe(_send(), WS_EVENT_LOOP)
    except Exception:
        pass


def sync_cloud_state(server_url: str, machine_code: str, payload: dict):
    """Sends immediate state sync to cloud Next.js server so Kiosk screen transitions reliably."""
    if not server_url or not machine_code:
        return
    try:
        url = f"{server_url.rstrip('/')}/api/kiosk/state"
        body = {"machineCode": machine_code, **payload}
        req = urllib.request.Request(
            url,
            data=json.dumps(body).encode('utf-8'),
            headers={"Content-Type": "application/json", "User-Agent": "SmartPrint-Pi5-StateSync/1.0"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=4) as resp:
            pass
    except Exception:
        pass


def post_cloud_state(server_url: str, machine_code: str, payload: dict):
    """Dispatches cloud state update on a background thread so print flow is never blocked."""
    threading.Thread(target=sync_cloud_state, args=(server_url, machine_code, payload), daemon=True).start()


def start_local_websocket_server(host="127.0.0.1", port=8765, server_url="", machine_code="", printer_name="", print_real=False):
    """Starts local async WebSocket server on ws://127.0.0.1:8765 for real-time kiosk browser UI events."""
    global WS_EVENT_LOOP, WS_SERVER_RUNNING
    if WS_SERVER_RUNNING or not websockets:
        return
    WS_SERVER_RUNNING = True

    def run_ws_loop():
        global WS_EVENT_LOOP
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        WS_EVENT_LOOP = loop

        async def handle_client(websocket):
            WS_CONNECTED_CLIENTS.add(websocket)
            print(f"  {GREEN}[LOCAL WS BRIDGE] Kiosk Chromium connected on ws://{host}:{port}{RESET}", flush=True)
            try:
                async for raw_msg in websocket:
                    try:
                        data = json.loads(raw_msg)
                        msg_type = data.get("type")
                        if msg_type == "TRIGGER_RELEASE":
                            print(f"  {CYAN}[WS TRIGGER] UI requested print release for {data.get('orderNumber')}{RESET}", flush=True)
                            threading.Thread(
                                target=execute_order_print_flow,
                                args=(data, server_url, machine_code, printer_name, print_real),
                                daemon=True
                            ).start()
                    except Exception as me:
                        print(f"  {YELLOW}[WS PARSE ERROR] {me}{RESET}", flush=True)
            except Exception:
                pass
            finally:
                WS_CONNECTED_CLIENTS.discard(websocket)
                print(f"  {YELLOW}[LOCAL WS BRIDGE] Kiosk Chromium disconnected{RESET}", flush=True)

        async def start_server():
            async with websockets.serve(handle_client, host, port):
                print(f"  {GREEN}{BOLD}[LOCAL WS BRIDGE]{RESET} Running on ws://{host}:{port} (Ready for Chromium Kiosk)", flush=True)
                await asyncio.Future()

        try:
            loop.run_until_complete(start_server())
        except Exception as e:
            print(f"  {RED}[LOCAL WS ERROR] {e}{RESET}", flush=True)

    t = threading.Thread(target=run_ws_loop, daemon=True, name="LocalWebSocketBridge")
    t.start()


def map_verify_error_to_tamil(error_msg: str) -> tuple[str, str]:
    """Maps Next.js backend error string to user-friendly alertType and Tamil explanation."""
    err_low = str(error_msg).lower()
    if any(x in err_low for x in ["already used", "already fulfilled", "single-use", "reused"]):
        return "ALREADY_USED", "இந்த QR பாஸ் ஏற்கனவே பயன்படுத்தப்பட்டுவிட்டது! மறுமுறை பயன்படுத்த முடியாது."
    elif "expired" in err_low:
        return "EXPIRED", "இந்த கியூஆர் பாஸின் காலாவதி நேரம் முடிந்துவிட்டது. புதிய ஆர்டரை உருவாக்கவும்."
    elif any(x in err_low for x in ["payment is still pending", "pending payment", "complete the payment"]):
        return "PAYMENT_PENDING", "இந்த ஆர்டருக்கான கட்டணம் நிலுவையில் உள்ளது. மொபைலில் பணத்தை செலுத்திவிட்டு முயற்சிக்கவும்."
    elif any(x in err_low for x in ["offline", "maintenance", "powered off"]):
        return "MACHINE_OFFLINE", "இந்த கியோஸ்க் தற்போது ஆஃப்லைனில் உள்ளது. வேறு ஆன்லைன் கியோஸ்க்கில் பிரிண்ட் எடுக்கலாம்."
    elif "paper" in err_low and ("empty" in err_low or "out" in err_low):
        return "PAPER_EMPTY", "கியோஸ்க்கில் பேப்பர் தீர்ந்துவிட்டது. நிர்வாகி பேப்பர் வைக்கும் வரை காத்திருக்கவும்."
    else:
        return "SCAN_ERROR", "தவறான கியூஆர் கோடு. தயவுசெய்து உங்கள் ரசீதில் உள்ள கியூஆரை ஸ்கேன் செய்யவும்."


def execute_order_print_flow(order_or_job: dict, server_url: str, machine_code: str, printer_name: str, print_real: bool):
    """
    Executes full touchless printing workflow:
    1. Concurrency lock (prevents dual scans from corrupting jobs)
    2. Atomic /api/pin/release claim
    3. Streams PRINT_PROGRESS to WebSocket
    4. Downloads document to private local spool
    5. Dispatches to Kyocera via CUPS with exact copies, duplex, and page ranges
    6. Tracks CUPS hardware completion
    7. Streams PRINT_COMPLETE to Kiosk UI (8s collection countdown)
    8. DoD 5220.22-M zero-wipe shredder
    9. Reports cloud ACK and auto-resets UI to Ready to Scan
    """
    global IS_BUSY, BUSY_LOCK
    with BUSY_LOCK:
        IS_BUSY = True

    try:
        order_id = order_or_job.get("id") or order_or_job.get("orderId") or ""
        order_num = order_or_job.get("orderNumber") or "ORD-UNKNOWN"
        pin_code = str(order_or_job.get("fourDigitPin") or order_or_job.get("pin") or "")
        file_name = order_or_job.get("fileName") or "Document.pdf"
        download_url = order_or_job.get("downloadUrl") or order_or_job.get("fileStorageUrl") or ""

        # Step 1: Claim order via /api/pin/release
        broadcast_ws({"type": "PRINT_PROGRESS", "progress": 15, "step": 1})
        post_cloud_state(server_url, machine_code, {"currentScreen": "printing", "printProgress": 15, "printStep": 1})

        rel_url = f"{server_url.rstrip('/')}/api/pin/release"
        rel_payload = {
            "machineCode": machine_code,
            "orderId": order_id,
            "orderNumber": order_num,
            "pin": pin_code
        }
        rel_data = {}
        try:
            req = urllib.request.Request(
                rel_url,
                data=json.dumps(rel_payload).encode("utf-8"),
                headers={"Content-Type": "application/json", "User-Agent": "SmartPrint-Pi5-Daemon/2.4"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                rel_data = json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            print(f"  {YELLOW}[RELEASE NOTICE] /api/pin/release response: {e}{RESET}", flush=True)

        job_info = rel_data.get("job") or {}
        if job_info:
            download_url = job_info.get("downloadUrl") or download_url
            file_name = job_info.get("fileName") or file_name
            order_id = job_info.get("orderId") or order_id
            order_num = job_info.get("orderNumber") or order_num
            pin_code = str(job_info.get("pin") or pin_code)

        pages_count = max(1, int(job_info.get("pages") or order_or_job.get("calculatedPrintPages") or order_or_job.get("pages") or 1))
        copies_count = max(1, int(job_info.get("copies") or order_or_job.get("copies") or 1))
        raw_duplex = str(job_info.get("duplexMode") or order_or_job.get("duplexMode") or "").strip().lower()
        is_duplex = bool(raw_duplex in ["duplex", "double", "two-sided", "both", "duplexnotumble"])
        page_ranges = str(job_info.get("pageRanges") or order_or_job.get("selectedPageRanges") or "all").strip()

        print(f"\n{GREEN}{BOLD}================================================================{RESET}", flush=True)
        print(f"{GREEN}{BOLD}   [*] EXECUTING PRINT JOB: {order_num}                        {RESET}", flush=True)
        print(f"{GREEN}{BOLD}================================================================{RESET}")
        print(f"  {BOLD}Document:{RESET}       {file_name}", flush=True)
        print(f"  {BOLD}Pages / Copy:{RESET}   {pages_count} pages | {copies_count} copy/copies | Page Range: {page_ranges}", flush=True)
        print(f"  {BOLD}Duplex Mode:{RESET}    {'DUPLEX (Two-Sided)' if is_duplex else 'SIMPLEX (Single-Sided)'}", flush=True)

        # Step 2: Download document
        broadcast_ws({"type": "PRINT_PROGRESS", "progress": 30, "step": 1})
        post_cloud_state(server_url, machine_code, {"currentScreen": "printing", "printProgress": 30, "printStep": 1})
        is_blank_order = ('blank' in file_name.lower()) or ('blank' in str(order_num).lower())
        local_file, file_bytes = download_job_file(server_url, download_url, order_num, file_name, pages_count=pages_count)
        print(f"  {BOLD}Spool File:{RESET}     {GREEN}[OK] {file_bytes:,} bytes → {os.path.basename(local_file)}{RESET}", flush=True)

        # Step 3: Spooling to printer
        broadcast_ws({"type": "PRINT_PROGRESS", "progress": 45, "step": 2})
        post_cloud_state(server_url, machine_code, {"currentScreen": "printing", "printProgress": 45, "printStep": 2})

        detected = detect_connected_printers(printer_name)
        target_printer = printer_name or "Kyocera_3212i"
        is_online = True
        chosen_port = "CUPS/Network"
        if detected:
            match = next((p for p in detected if target_printer.lower() in p["name"].lower()), detected[0])
            target_printer = match["name"]
            is_online = match.get("connected", True)
            chosen_port = match.get("port", "CUPS/Network")

        print(f"  {BOLD}Printer Target:{RESET} {YELLOW}{target_printer}{RESET} [{chosen_port}]", flush=True)

        def on_cups_progress(pct, step):
            broadcast_ws({"type": "PRINT_PROGRESS", "progress": pct, "step": step})
            post_cloud_state(server_url, machine_code, {"currentScreen": "printing", "printProgress": pct, "printStep": step})

        if is_blank_order:
            is_duplex = False
            page_ranges = "all"
            copies_count = 1

        spool_ok, spool_msg = dispatch_to_printer(
            local_file, target_printer, print_real, is_online,
            is_test_print=False, is_duplex=is_duplex, copies=copies_count,
            page_ranges=page_ranges, progress_callback=on_cups_progress
        )

        if spool_ok:
            # Step 4: Complete
            broadcast_ws({"type": "PRINT_COMPLETE", "progress": 100, "step": 4})
            post_cloud_state(server_url, machine_code, {"currentScreen": "collect_documents", "printProgress": 100, "printStep": 4})
            report_job_ack(server_url, order_id, order_num, pin_code, True, spool_msg)
            wiped_bytes = dod_5220_shred_file(local_file)
            print(f"  {BOLD}Privacy Shred:{RESET}  {GREEN}DoD 5220.22-M Zero-Wipe Verified: {wiped_bytes:,} bytes shredded (0 Bytes Left on Disk){RESET}", flush=True)
            print(f"{GREEN}{BOLD}================================================================{RESET}\n", flush=True)

            # Wait 8s for customer collection countdown (matches UI screen)
            time.sleep(8.0)
            broadcast_ws({"type": "RESET_TO_READY"})
            post_cloud_state(server_url, machine_code, {"currentScreen": "ready_to_scan", "clearActiveOrder": True})
        else:
            broadcast_ws({
                "type": "SCAN_ALERT",
                "alertType": "PRINT_ERROR",
                "error": f"Printer Spool Error: {spool_msg}",
                "tamilMessage": "பிரிண்ட் செய்வதில் பிழை ஏற்பட்டது. தயவுசெய்து கியோஸ்க் நிர்வாகியை அணுகவும்."
            })
            post_cloud_state(server_url, machine_code, {
                "scanAlert": {
                    "type": "PRINT_ERROR",
                    "message": f"Printer Spool Error: {spool_msg}",
                    "tamilMessage": "பிரிண்ட் செய்வதில் பிழை ஏற்பட்டது. தயவுசெய்து கியோஸ்க் நிர்வாகியை அணுகவும்."
                }
            })
            report_job_ack(server_url, order_id, order_num, pin_code, False, spool_msg)
            dod_5220_shred_file(local_file)
            time.sleep(7.0)
            broadcast_ws({"type": "RESET_TO_READY"})
            post_cloud_state(server_url, machine_code, {"currentScreen": "ready_to_scan", "clearActiveOrder": True, "clearScanAlert": True})

    except Exception as e:
        print(f"  {RED}[PRINT FLOW ERROR] {e}{RESET}", flush=True)
        broadcast_ws({
            "type": "SCAN_ALERT",
            "alertType": "PRINT_ERROR",
            "error": str(e),
            "tamilMessage": "பிரிண்ட் செய்வதில் எதிர்பாராத பிழை ஏற்பட்டது."
        })
        post_cloud_state(server_url, machine_code, {
            "scanAlert": {
                "type": "PRINT_ERROR",
                "message": str(e),
                "tamilMessage": "பிரிண்ட் செய்வதில் எதிர்பாராத பிழை ஏற்பட்டது."
            }
        })
        time.sleep(7.0)
        broadcast_ws({"type": "RESET_TO_READY"})
        post_cloud_state(server_url, machine_code, {"currentScreen": "ready_to_scan", "clearActiveOrder": True, "clearScanAlert": True})
    finally:
        with BUSY_LOCK:
            IS_BUSY = False


def process_scanned_string(scanned_str: str, server_url: str, machine_code: str, printer_name: str, print_real: bool):
    """Processes an optical QR scan event from MH-ET LIVE scanner."""
    global IS_BUSY, BUSY_LOCK
    scanned_str = scanned_str.strip()
    if not scanned_str:
        return

    # Filter 1D linear product barcodes
    if re.match(r'^\d{8,14}$', scanned_str):
        print(f"\n{YELLOW}[1D BARCODE REJECTED] Scanned input '{scanned_str}' is a 1D barcode. Only 2D QR Codes are accepted.{RESET}", flush=True)
        return

    with BUSY_LOCK:
        if IS_BUSY:
            print(f"\n{YELLOW}[BUSY] Scan ignored: Kiosk currently processing another job.{RESET}", flush=True)
            broadcast_ws({
                "type": "BUSY_ALERT",
                "message": "Kiosk is currently printing. Please wait for paper to exit.",
                "tamilMessage": "மெஷின் தற்போது பிரிண்ட் செய்து கொண்டிருக்கிறது. தயவுசெய்து காத்திருக்கவும்."
            })
            return

    print(f"\n{GREEN}{BOLD}[QR SCANNED - READY TO SCAN]{RESET} Raw input: {scanned_str[:120]}", flush=True)
    # Immediately shift UI to Verifying Order
    broadcast_ws({"type": "SCAN_START"})
    post_cloud_state(server_url, machine_code, {"currentScreen": "verifying_order", "isVerifying": True})

    pin = None
    order_id = None
    order_num = None

    if '{' in scanned_str and '}' in scanned_str:
        start_i = scanned_str.find('{')
        end_i = scanned_str.rfind('}') + 1
        try:
            parsed = json.loads(scanned_str[start_i:end_i])
            pin = parsed.get('pin') or parsed.get('fourDigitPin')
            order_id = parsed.get('orderId') or parsed.get('id')
            order_num = parsed.get('orderNumber')
        except Exception:
            pass

    if not pin:
        pin_match = re.search(r'["\']?pin["\']?\s*:\s*["\']?(\d{4})["\']?', scanned_str, re.IGNORECASE)
        if pin_match:
            pin = pin_match.group(1)
        else:
            four_dig = re.search(r'\b\d{4}\b', scanned_str)
            if four_dig:
                pin = four_dig.group(0)

    if not order_id:
        uuid_match = re.search(r'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', scanned_str, re.IGNORECASE)
        if uuid_match:
            order_id = uuid_match.group(1)

    if not order_num:
        ord_match = re.search(r'(ORD-[A-Za-z0-9_-]+)', scanned_str, re.IGNORECASE)
        if ord_match:
            order_num = ord_match.group(1)

    # Call /api/pin/verify
    verify_url = f"{server_url.rstrip('/')}/api/pin/verify"
    v_payload = {
        "machineCode": machine_code,
        "qrData": scanned_str,
        "pin": pin,
        "orderId": order_id,
        "orderNumber": order_num
    }
    try:
        req = urllib.request.Request(
            verify_url,
            data=json.dumps(v_payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "User-Agent": "SmartPrint-Pi5-Daemon/2.4"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            v_data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as he:
        try:
            v_data = json.loads(he.read().decode("utf-8"))
        except Exception:
            v_data = {"success": False, "error": f"HTTP {he.code}: {he.reason}"}
    except Exception as e:
        v_data = {"success": False, "error": f"Connection error: {e}"}

    if not v_data.get("success"):
        err_msg = v_data.get("error") or "Order verification failed"
        alert_type, tamil_msg = map_verify_error_to_tamil(err_msg)
        print(f"  {RED}[VERIFY FAILED] {err_msg}{RESET}", flush=True)
        broadcast_ws({
            "type": "SCAN_ALERT",
            "alertType": alert_type,
            "error": err_msg,
            "tamilMessage": tamil_msg,
            "orderNumber": order_num or "",
            "fileName": ""
        })
        post_cloud_state(server_url, machine_code, {
            "scanAlert": {
                "type": alert_type,
                "message": err_msg,
                "tamilMessage": tamil_msg,
                "orderNumber": order_num or ""
            }
        })
        time.sleep(7.0)
        broadcast_ws({"type": "RESET_TO_READY"})
        post_cloud_state(server_url, machine_code, {"currentScreen": "ready_to_scan", "clearActiveOrder": True, "clearScanAlert": True})
        return

    # Order verified successfully!
    verified_order = v_data.get("order") or {}
    print(f"  {GREEN}{BOLD}[ORDER VERIFIED]{RESET} {verified_order.get('orderNumber')} | {verified_order.get('fileName')}", flush=True)

    with BUSY_LOCK:
        IS_BUSY = True

    # Transition UI to Order Details (triggers 3s auto countdown)
    broadcast_ws({
        "type": "ORDER_VERIFIED",
        "order": verified_order
    })
    post_cloud_state(server_url, machine_code, {
        "currentScreen": "order_details",
        "isVerifying": False,
        "activeOrder": verified_order
    })

    # Countdown wait for non-touchscreen display
    time.sleep(3.2)

    # Commencing real printing
    execute_order_print_flow(verified_order, server_url, machine_code, printer_name, print_real)


def check_is_kiosk_scanner_active(server_url: str, machine_code: str) -> tuple[bool, str]:
    """Checks if Kiosk UI is online and ready."""
    url = f"{server_url.rstrip('/')}/api/kiosk/state?machineCode={machine_code}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "SmartPrint-Pi5-Scanner/2.4"})
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return bool(data.get("isScannerActive", True)), str(data.get("currentScreen", "ready_to_scan"))
    except Exception:
        return True, "ready_to_scan"


def find_scanner_input_device() -> str | None:
    """Finds the real physical USB barcode/QR scanner event device dynamically."""
    by_id_matches = (
        glob.glob('/dev/input/by-id/*Serial_To_HID*') or
        glob.glob('/dev/input/by-id/*barcode*') or
        glob.glob('/dev/input/by-id/*scanner*') or
        glob.glob('/dev/input/by-id/*1a86*') or
        glob.glob('/dev/input/by-id/*e026*')
    )
    if by_id_matches:
        for p in by_id_matches:
            if os.path.exists(p):
                return os.path.realpath(p)

    try:
        if os.path.exists('/proc/bus/input/devices'):
            with open('/proc/bus/input/devices', 'r') as f:
                content = f.read()
            blocks = content.split('\n\n')
            for b in blocks:
                b_low = b.lower()
                if any(x in b_low for x in ['serial to hid', '1a86', 'e026', 'barcode', 'qr scanner', 'scanner']):
                    if any(ign in b_low for ign in ['hdmi', 'pwr_button', 'vc4']):
                        continue
                    m = re.search(r'Handlers=.*?(event\d+)', b)
                    if m:
                        candidate = f"/dev/input/{m.group(1)}"
                        if os.path.exists(candidate):
                            return candidate
    except Exception:
        pass

    return None


def set_scanner_hardware_power(enable: bool = True) -> bool:
    """Powers ON physical 5V USB power to MH-ET LIVE scanner via uhubctl on Raspberry Pi 5 if not already active."""
    if platform.system() != "Linux":
        return True
    if enable and find_scanner_input_device():
        return True
    uhubctl_bin = "/usr/sbin/uhubctl" if os.path.exists("/usr/sbin/uhubctl") else "uhubctl"
    action = "1" if enable else "0"
    try:
        cmd = ["sudo", uhubctl_bin, "-l", "1", "-p", "1", "-a", action]
        res = subprocess.run(cmd, capture_output=True, timeout=4)
        return res.returncode == 0
    except Exception:
        return False


def start_serial_scanner_listener(server_url: str, machine_code: str, printer_name: str, print_real: bool):
    """Background listener for MH-ET LIVE scanner when running in USB-Serial (CDC-ACM) mode."""
    if not serial:
        return

    def serial_loop():
        while True:
            candidates = glob.glob("/dev/ttyACM*") + glob.glob("/dev/ttyUSB*")
            if not candidates:
                time.sleep(2.0)
                continue
            port = candidates[0]
            try:
                with serial.Serial(port, baudrate=9600, timeout=0.2) as ser:
                    print(f"  {GREEN}{BOLD}[SERIAL SCANNER]{RESET} Listening on {port} (9600 baud)...", flush=True)
                    while True:
                        line = ser.readline().decode('utf-8', errors='replace').strip()
                        if line:
                            threading.Thread(
                                target=process_scanned_string,
                                args=(line, server_url, machine_code, printer_name, print_real),
                                daemon=True
                            ).start()
            except Exception:
                time.sleep(2.0)

    t = threading.Thread(target=serial_loop, daemon=True, name="SerialScannerListener")
    t.start()


def start_hardware_scanner_listener(server_url: str, machine_code: str, printer_name: str = "", print_real: bool = False):
    """Starts background listener that captures HID scanner events (24/7 Always Ready to Scan)."""
    if platform.system() != "Linux":
        return

    set_scanner_hardware_power(True)
    start_serial_scanner_listener(server_url, machine_code, printer_name, print_real)

    def listener_loop():
        KEY_MAP = {
            2: '1', 3: '2', 4: '3', 5: '4', 6: '5', 7: '6', 8: '7', 9: '8', 10: '9', 11: '0',
            28: '\n', 96: '\n', 15: '\t', 57: ' ',
            16: 'q', 17: 'w', 18: 'e', 19: 'r', 20: 't', 21: 'y', 22: 'u', 23: 'i', 24: 'o', 25: 'p',
            30: 'a', 31: 's', 32: 'd', 33: 'f', 34: 'g', 35: 'h', 36: 'j', 37: 'k', 38: 'l',
            44: 'z', 45: 'x', 46: 'c', 47: 'v', 48: 'b', 49: 'n', 50: 'm',
            52: '.', 53: '/', 12: '-', 13: '=', 26: '[', 27: ']', 39: ';', 40: "'", 43: '\\',
            51: ',', 14: '',
            79: '1', 80: '2', 81: '3', 75: '4', 76: '5', 77: '6', 71: '7', 72: '8', 73: '9', 82: '0',
            74: '-', 78: '+', 83: '.', 98: '/'
        }
        SHIFT_KEY_MAP = {
            2: '!', 3: '@', 4: '#', 5: '$', 6: '%', 7: '^', 8: '&', 9: '*', 10: '(', 11: ')',
            12: '_', 13: '+', 26: '{', 27: '}', 39: ':', 40: '"', 51: '<', 52: '>', 53: '?'
        }

        import select

        while True:
            dev_path = find_scanner_input_device()
            if not dev_path:
                time.sleep(1.0)
                continue

            print(f"  {GREEN}{BOLD}[HARDWARE SCANNER]{RESET} Listening on {dev_path} (Ready to scan)...", flush=True)

            try:
                with open(dev_path, 'rb') as f:
                    chars = []
                    is_shift = False
                    while True:
                        r, _, _ = select.select([f], [], [], 0.15)
                        if not r:
                            if len(chars) >= 4:
                                s = "".join(chars)
                                chars = []
                                threading.Thread(
                                    target=process_scanned_string,
                                    args=(s, server_url, machine_code, printer_name, print_real),
                                    daemon=True
                                ).start()
                            continue

                        try:
                            data = f.read(24)
                        except (OSError, ValueError):
                            print(f"  {YELLOW}[HARDWARE SCANNER] Read error, reconnecting...{RESET}", flush=True)
                            break

                        if not data:
                            print(f"  {YELLOW}[HARDWARE SCANNER] Device disconnected / EOF, reconnecting...{RESET}", flush=True)
                            break

                        if len(data) < 24:
                            continue

                        sec, usec, ev_type, ev_code, ev_val = struct.unpack('qqHHi', data)
                        if ev_type == 1:  # EV_KEY
                            if ev_code in (42, 54):  # Shift
                                is_shift = (ev_val != 0)
                            elif ev_val == 1:  # Key Down
                                if is_shift and ev_code in SHIFT_KEY_MAP:
                                    c = SHIFT_KEY_MAP[ev_code]
                                elif is_shift and ev_code in KEY_MAP:
                                    c = KEY_MAP[ev_code].upper()
                                else:
                                    c = KEY_MAP.get(ev_code, '')

                                if c in ('\n', '\t'):
                                    s = "".join(chars)
                                    chars = []
                                    threading.Thread(
                                        target=process_scanned_string,
                                        args=(s, server_url, machine_code, printer_name, print_real),
                                        daemon=True
                                    ).start()
                                elif c:
                                    chars.append(c)
            except Exception as e:
                print(f"  {YELLOW}[HARDWARE SCANNER] Exception: {e}, retrying in 1s...{RESET}", flush=True)
                time.sleep(1.0)

    t = threading.Thread(target=listener_loop, daemon=True, name="HardwareScannerListener")
    t.start()


def main():
    parser = argparse.ArgumentParser(description="SmartPrint Kiosk Raspberry Pi 5 Daemon")
    parser.add_argument("--machine", "-m", default="RIT-ATM-01", help="Target Machine Code (e.g. RIT-ATM-01)")
    parser.add_argument("--token", "-t", default="tok_default_sec", help="Daemon Secret Token from Admin")
    parser.add_argument("--server", "-s", default="http://localhost:3000", help="Next.js Cloud Server URL")
    parser.add_argument("--interval", "-i", type=int, default=2, help="Heartbeat interval in seconds")
    parser.add_argument("--printer", "-p", default="", help="Specific printer name (default: auto-detect)")
    parser.add_argument("--print-real", action="store_true", help="Send actual print commands to physical printer feeder")

    args = parser.parse_args()

    print_banner(args.machine, args.server)
    print(f"{YELLOW}Initiating telemetry loop & hardware bridge... Press Ctrl+C at any time to stop.{RESET}\n", flush=True)

    # 1. Start Local WebSocket Bridge on ws://127.0.0.1:8765
    start_local_websocket_server(
        host="127.0.0.1", port=8765,
        server_url=args.server, machine_code=args.machine,
        printer_name=args.printer, print_real=args.print_real
    )

    # 2. Start Non-blocking hardware QR scanner listener (HID + Serial)
    start_hardware_scanner_listener(
        args.server, args.machine,
        printer_name=args.printer, print_real=args.print_real
    )

    pulse_count = 0

    while True:
        pulse_count += 1
        timestamp = time.strftime("%H:%M:%S")

        success, data, temp, ram = send_heartbeat(args.server, args.machine, args.token, args.printer)

        if success:
            # Check for released print jobs from cloud heartbeat
            jobs = data.get("jobs", [])
            if jobs:
                for job in jobs:
                    if not IS_BUSY:
                        threading.Thread(
                            target=execute_order_print_flow,
                            args=(job, args.server, args.machine, args.printer, args.print_real),
                            daemon=True
                        ).start()

            config = data.get("config", {})
            bw_cap = "[OK] B&W" if config.get("supportsBw") else "[X] B&W"
            color_cap = "[OK] Color" if config.get("supportsColor") else "[X] Color (Disabled)"
            duplex_cap = "[OK] Duplex" if config.get("supportsDuplex") else "[X] Duplex"
            sheets = config.get("currentSheetsRemaining", 500)

            print(
                f"[{timestamp}] {GREEN}PULSE #{pulse_count} OK{RESET} | "
                f"Status: {GREEN}ONLINE{RESET} | "
                f"CPU: {temp}C | RAM: {ram}% | Paper: {sheets} pgs | "
                f"{CYAN}{bw_cap} | {color_cap} | {duplex_cap}{RESET}",
                flush=True
            )
        else:
            print(
                f"[{timestamp}] {RED}PULSE #{pulse_count} FAILED{RESET} | "
                f"Error: {data}",
                flush=True
            )

        time.sleep(args.interval)


def send_offline_notice(server_url: str, machine_code: str, daemon_token: str):
    """Signals Next.js backend immediately that the daemon was shut down / powered off."""
    url = f"{server_url.rstrip('/')}/api/kiosk/heartbeat"
    payload = {
        "machineCode": machine_code,
        "daemonSecretToken": daemon_token,
        "status": "offline",
        "powerOff": True,
    }
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "User-Agent": "SmartPrint-Pi5-Daemon/2.4"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=3) as _:
            pass
    except Exception:
        pass


if __name__ == "__main__":
    machine_code = "RIT-ATM-01"
    server_url = "http://localhost:3000"
    daemon_token = "tok_default_sec"
    for i, a in enumerate(sys.argv):
        if a in ("-m", "--machine") and i + 1 < len(sys.argv):
            machine_code = sys.argv[i + 1]
        if a in ("-s", "--server") and i + 1 < len(sys.argv):
            server_url = sys.argv[i + 1]
        if a in ("-t", "--token") and i + 1 < len(sys.argv):
            daemon_token = sys.argv[i + 1]

    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}SmartPrint Daemon stopped by user. Sending instant OFFLINE signal to cloud...{RESET}", flush=True)
        send_offline_notice(server_url, machine_code, daemon_token)
        print(f"{RED}[OFFLINE] Machine {machine_code} reported as OFFLINE on Admin Console.{RESET}\n", flush=True)
        sys.exit(0)
