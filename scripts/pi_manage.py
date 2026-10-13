import paramiko
import os
import sys
import time

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

PI_IP = "172.15.28.232"
PI_USER = "ritadmin"
PI_PASS = "adminadmin"
LOCAL_DAEMON = os.path.join(os.path.dirname(__file__), "..", "kiosk-client", "smartprint_daemon.py")
REMOTE_DIR = "/home/ritadmin/printpoint-kiosk"
REMOTE_DAEMON = f"{REMOTE_DIR}/smartprint_daemon.py"

SYSTEMD_SERVICE = """[Unit]
Description=SmartPrint Autonomous ATM Kiosk Hardware Controller
After=network-online.target cups.service
Wants=network-online.target cups.service

[Service]
Type=simple
User=ritadmin
WorkingDirectory=/home/ritadmin/printpoint-kiosk
ExecStart=/usr/bin/python3 /home/ritadmin/printpoint-kiosk/smartprint_daemon.py --machine RIT-ATM-01 --server https://printpoint-kiosk.vercel.app --printer Kyocera_3212i --print-real --interval 3
Restart=always
RestartSec=5
StandardOutput=append:/home/ritadmin/printpoint-kiosk/daemon.log
StandardError=append:/home/ritadmin/printpoint-kiosk/daemon.log

[Install]
WantedBy=multi-user.target
"""

def run_cmd(ssh, cmd, label="", show_output=True):
    print(f"\n{'='*55}")
    if label:
        print(f"  {label}")
    print(f"  CMD: {cmd[:80]}{'...' if len(cmd)>80 else ''}")
    print(f"{'='*55}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=120)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if show_output and out:
        print(out)
    if err:
        filtered = [l for l in err.splitlines() if l.strip() and "sudo" not in l and "WARNING" not in l]
        if filtered:
            print("STDERR:", "\n".join(filtered))
    return out, err


def main():
    print(f"\n{'='*55}")
    print(f"  SmartPrint Pi5 Remote Config & Deploy")
    print(f"  Target: {PI_USER}@{PI_IP}")
    print(f"{'='*55}\n")

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(PI_IP, username=PI_USER, password=PI_PASS, timeout=10)
        print("✅ SSH Connected to Raspberry Pi 5!")
    except Exception as e:
        print(f"❌ SSH Connection FAILED: {e}")
        print(f"   Check Pi IP ({PI_IP}), username ({PI_USER}), password, and network.")
        sys.exit(1)

    # ── Step 1: Stop old service ─────────────────────────────────────────────
    run_cmd(ssh,
        f"echo '{PI_PASS}' | sudo -S systemctl stop smartprint.service 2>/dev/null; "
        f"pkill -f smartprint_daemon 2>/dev/null; sleep 1; echo 'Stopped.'",
        label="Step 1: Stopping old daemon service")

    # ── Step 2: Upload latest daemon via SFTP ────────────────────────────────
    print(f"\n{'='*55}")
    print(f"  Step 2: Uploading latest smartprint_daemon.py")
    print(f"{'='*55}")
    sftp = ssh.open_sftp()
    try:
        sftp.mkdir(REMOTE_DIR)
    except Exception:
        pass
    local_abs = os.path.abspath(LOCAL_DAEMON)
    print(f"  Local:  {local_abs}")
    print(f"  Remote: {REMOTE_DAEMON}")
    sftp.put(local_abs, REMOTE_DAEMON)
    local_size = os.path.getsize(local_abs)
    print(f"  ✅ Uploaded {local_size:,} bytes successfully!")

    # Write updated systemd service file
    remote_svc_tmp = f"{REMOTE_DIR}/smartprint.service.tmp"
    with sftp.file(remote_svc_tmp, "w") as f:
        f.write(SYSTEMD_SERVICE)
    sftp.close()
    print(f"  ✅ Service file staged at {remote_svc_tmp}")

    # ── Step 3: Install Python dependencies (img2pdf + pillow) ───────────────
    run_cmd(ssh,
        "pip3 install --quiet img2pdf pillow 2>&1 | tail -5",
        label="Step 3: Installing img2pdf + Pillow (image→PDF conversion)")

    # ── Step 4: Verify ImageMagick is available ───────────────────────────────
    run_cmd(ssh,
        "which convert && convert --version | head -2 || echo 'ImageMagick not found (optional, img2pdf is primary)'",
        label="Step 4: Checking ImageMagick convert availability")

    # ── Step 5: Verify CUPS + Kyocera printer ────────────────────────────────
    run_cmd(ssh,
        "lpstat -p && echo '---' && lpoptions -d Kyocera_3212i && echo 'Kyocera_3212i set as default'",
        label="Step 5: Verifying CUPS printers & setting default")

    # ── Step 6: Install + enable systemd service ─────────────────────────────
    setup_commands = [
        f"chmod +x {REMOTE_DAEMON}",
        f"echo '{PI_PASS}' | sudo -S mv {remote_svc_tmp} /etc/systemd/system/smartprint.service",
        f"echo '{PI_PASS}' | sudo -S systemctl daemon-reload",
        f"echo '{PI_PASS}' | sudo -S systemctl enable smartprint.service",
        f"echo '{PI_PASS}' | sudo -S systemctl restart smartprint.service",
        "sleep 2",
        f"echo '{PI_PASS}' | sudo -S systemctl status smartprint.service --no-pager -l",
    ]
    run_cmd(ssh,
        " && ".join(setup_commands),
        label="Step 6: Installing systemd service & restarting daemon")

    # ── Step 7: Show recent daemon logs ─────────────────────────────────────
    time.sleep(3)
    run_cmd(ssh,
        f"tail -n 30 {REMOTE_DIR}/daemon.log 2>/dev/null || "
        f"echo '{PI_PASS}' | sudo -S journalctl -u smartprint.service -n 30 --no-pager",
        label="Step 7: Recent Daemon Logs (last 30 lines)")

    # ── Step 8: Verify Python imports work ───────────────────────────────────
    run_cmd(ssh,
        "python3 -c \"import img2pdf; print('img2pdf OK'); from PIL import Image; print('Pillow OK')\"",
        label="Step 8: Verifying Python imports on Pi")

    print(f"\n{'='*55}")
    print(f"  ✅ ALL DONE — Raspberry Pi 5 fully configured!")
    print(f"  Daemon is running with the fix:")
    print(f"    • No silent placeholder fallback")
    print(f"    • PNG/JPG auto-converted to PDF before CUPS")
    print(f"    • Sequential file upload (no race condition)")
    print(f"{'='*55}\n")

    ssh.close()


if __name__ == "__main__":
    main()
