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

def main():
    print(f"Connecting to Pi 5 ({PI_IP})...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(PI_IP, username=PI_USER, password=PI_PASS, timeout=8)
    print("SSH Connected successfully!")

    # 1. Stop any old instance
    print("Stopping existing processes...")
    ssh.exec_command(f"echo '{PI_PASS}' | sudo -S systemctl stop smartprint.service 2>/dev/null; pkill -f smartprint_daemon 2>/dev/null")
    time.sleep(1)

    # 2. Upload latest daemon
    sftp = ssh.open_sftp()
    try:
        sftp.mkdir(REMOTE_DIR)
    except Exception:
        pass
    print(f"Uploading {LOCAL_DAEMON} -> {REMOTE_DAEMON}...")
    sftp.put(LOCAL_DAEMON, REMOTE_DAEMON)
    print("Upload complete!")

    # Write service file to a temp location and move it with sudo
    remote_svc_tmp = f"{REMOTE_DIR}/smartprint.service"
    with sftp.file(remote_svc_tmp, "w") as f:
        f.write(SYSTEMD_SERVICE)
    sftp.close()

    # 3. Configure CUPS default and install systemd service
    setup_commands = [
        f"chmod +x {REMOTE_DAEMON}",
        "lpoptions -d Kyocera_3212i",
        f"echo '{PI_PASS}' | sudo -S mv {remote_svc_tmp} /etc/systemd/system/smartprint.service",
        f"echo '{PI_PASS}' | sudo -S systemctl daemon-reload",
        f"echo '{PI_PASS}' | sudo -S systemctl enable smartprint.service",
        f"echo '{PI_PASS}' | sudo -S systemctl restart smartprint.service",
    ]

    full_cmd = " && ".join(setup_commands)
    stdin, stdout, stderr = ssh.exec_command(full_cmd)
    stdout_text = stdout.read().decode()
    stderr_text = stderr.read().decode()
    print("Setup output:", stdout_text)
    if stderr_text:
        print("Setup stderr (filtered):", [line for line in stderr_text.splitlines() if "sudo" not in line and line.strip()])

    # 4. Wait 3 seconds and check status and logs
    time.sleep(3)
    check_cmd = (
        "systemctl status smartprint.service --no-pager && "
        "echo '=== RECENT DAEMON LOGS ===' && "
        f"tail -n 25 {REMOTE_DIR}/daemon.log"
    )
    stdin, stdout, stderr = ssh.exec_command(check_cmd)
    print("\n" + "="*50)
    print(stdout.read().decode())
    print("="*50)

    ssh.close()

if __name__ == "__main__":
    main()
