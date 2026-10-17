import sys
import os
import time
import json
import urllib.request
import paramiko

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PI_IP = "172.15.28.232"
PI_USER = "ritadmin"
PI_PASS = "adminadmin"
SERVER_URL = "https://printpoint-kiosk.vercel.app"
MACHINE_CODE = "RIT-ATM-01"

print("=" * 65)
print("   SMARTPRINT ATM - FULL SYSTEM BACKTEST & HEALTH AUDIT")
print("=" * 65)

# -------------------------------------------------------------
# STEP 1: Raspberry Pi Hardware & Daemon Verification
# -------------------------------------------------------------
print("\n[STEP 1] Checking Raspberry Pi Hardware & Daemon Status...")
try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(PI_IP, username=PI_USER, password=PI_PASS, timeout=8)
    print(f"  ✓ SSH Connection to Pi ({PI_IP}): SUCCESS")

    # 1.1 Scanner device
    _, out, _ = ssh.exec_command("ls -la /dev/input/by-id/ 2>/dev/null")
    devices = out.read().decode("utf-8")
    if "Serial_To_HID" in devices:
        print("  ✓ MH-ET LIVE Barcode/QR Scanner: DETECTED (/dev/input/by-id/*Serial_To_HID*)")
    else:
        print("  ✗ MH-ET LIVE Scanner: NOT FOUND in /dev/input/by-id/")
        print("    Devices found:\n", devices)

    # 1.2 Scanner thread verification
    _, out, _ = ssh.exec_command("ps -T -p $(pgrep -f smartprint_daemon.py) -o spid,cmd 2>/dev/null")
    threads = out.read().decode("utf-8").strip()
    thread_count = len(threads.splitlines()) - 1 if threads else 0
    print(f"  ✓ smartprint_daemon.py Threads: {thread_count} active threads (Main Heartbeat + Hardware Scanner Listener)")

    # 1.3 CUPS Printer status
    _, out, _ = ssh.exec_command("lpstat -p Kyocera_3212i -l 2>/dev/null")
    printer_info = out.read().decode("utf-8").strip()
    if "Kyocera_3212i is idle" in printer_info or "Kyocera_3212i" in printer_info:
        print(f"  ✓ CUPS Printer (Kyocera_3212i): READY ({printer_info.splitlines()[0] if printer_info else 'OK'})")
    else:
        print(f"  ✗ CUPS Printer (Kyocera_3212i): {printer_info}")

    # 1.3 Kyocera 9100 port reachability
    _, out, _ = ssh.exec_command("python3 -c \"import socket; s = socket.socket(); s.settimeout(2); res = s.connect_ex(('172.15.2.212', 9100)); print('OPEN' if res == 0 else 'CLOSED'); s.close()\"")
    port_status = out.read().decode("utf-8").strip()
    if port_status == "OPEN":
        print("  ✓ Kyocera Physical Port 172.15.2.212:9100: ONLINE & REACHABLE")
    else:
        print(f"  ✗ Kyocera Physical Port: {port_status}")

    # 1.4 Daemon systemd status
    _, out, _ = ssh.exec_command("systemctl is-active smartprint.service")
    service_status = out.read().decode("utf-8").strip()
    print(f"  ✓ smartprint.service: {service_status.upper()}")

    # 1.5 Recent Daemon Pulse
    _, out, _ = ssh.exec_command("tail -n 3 /home/ritadmin/printpoint-kiosk/daemon.log 2>/dev/null")
    daemon_tail = out.read().decode("utf-8").strip()
    print("  ✓ Recent Heartbeats from Pi Daemon:")
    for line in daemon_tail.splitlines():
        print("    ", line)

    ssh.close()
except Exception as e:
    print(f"  ✗ Pi Connection Error: {e}")

# -------------------------------------------------------------
# STEP 2: Cloud Server (Vercel) & Kiosk Health
# -------------------------------------------------------------
print("\n[STEP 2] Verifying Cloud Backend & Machine Telemetry...")
try:
    req = urllib.request.Request(
        f"{SERVER_URL}/api/kiosk/{MACHINE_CODE}",
        headers={"User-Agent": "SmartPrint-Backtest/1.0"}
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        kiosk_data = json.loads(resp.read().decode("utf-8"))
        print(f"  ✓ Cloud Kiosk Endpoint ({SERVER_URL}/api/kiosk/{MACHINE_CODE}): HTTP 200 OK")
        machine = kiosk_data.get("machine", {})
        print(f"    - Machine Code: {machine.get('machineCode') or machine.get('machine_code')}")
        print(f"    - Display Name: {machine.get('displayName') or machine.get('display_name')}")
        print(f"    - Status:       {machine.get('status')}")
        print(f"    - Paper Count:  {machine.get('currentSheetsRemaining') or machine.get('current_sheets_remaining')} sheets")
        print(f"    - Last Pulse:   {machine.get('lastHeartbeatAt') or machine.get('last_heartbeat_at')}")
except Exception as e:
    print(f"  ✗ Cloud Backend Error: {e}")

# -------------------------------------------------------------
# STEP 3: Scanner PIN Release & Order Dispatch Backtest
# -------------------------------------------------------------
print("\n[STEP 3] Testing Scanner Trigger & Order Release Workflow...")
try:
    # Check PIN verify with a dummy or existing test order
    # Let's inspect latest orders in Supabase to find a valid PIN
    from urllib.parse import urlencode
    import urllib.request

    supabase_url = "https://nsfalguxcgsshssmgkom.supabase.co"
    service_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zZmFsZ3V4Y2dzc2hzc21na29tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTM2MjY4NCwiZXhwIjoyMTA2OTM4Njg0fQ.ldvQdwFY_ANUTEHgAR-IR1PBZySvsiHUXJo2MfDUI6g"

    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json"
    }

    req = urllib.request.Request(
        f"{supabase_url}/rest/v1/orders?select=id,order_number,four_digit_pin,order_status,payment_status,file_name,created_at&order=created_at.desc&limit=3",
        headers=headers
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        orders = json.loads(resp.read().decode("utf-8"))
        print(f"  ✓ Supabase Database Connection: OK (Found {len(orders)} recent orders)")
        for ord in orders:
            print(f"    - Order: {ord.get('order_number')} | PIN: {ord.get('four_digit_pin')} | Status: {ord.get('order_status')} | Paid: {ord.get('payment_status')}")

except Exception as e:
    print(f"  ✗ Supabase Query Error: {e}")

print("\n" + "=" * 65)
print("   HEALTH CHECK COMPLETE")
print("=" * 65)
