import urllib.request
import json
import time
import paramiko

print("--- SIMULATING USER CLICKING Scan QR Pass ---")
req = urllib.request.Request(
    "https://printpoint-kiosk.vercel.app/api/kiosk/state",
    data=json.dumps({"machineCode": "RIT-ATM-01", "currentScreen": "scan_qr", "isScannerActive": True}).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST"
)
with urllib.request.urlopen(req, timeout=8) as resp:
    print("Kiosk State updated:", resp.read().decode("utf-8"))

time.sleep(2)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("172.15.28.232", username="ritadmin", password="adminadmin")

_, stdout, _ = ssh.exec_command("tail -n 8 /home/ritadmin/printpoint-kiosk/daemon.log")
print("\nPi Daemon Log after entering 'scan_qr':\n", stdout.read().decode("utf-8"))

print("\n--- SIMULATING USER RETURNING HOME ---")
req2 = urllib.request.Request(
    "https://printpoint-kiosk.vercel.app/api/kiosk/state",
    data=json.dumps({"machineCode": "RIT-ATM-01", "currentScreen": "home", "isScannerActive": False}).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST"
)
with urllib.request.urlopen(req2, timeout=8) as resp:
    print("Kiosk State updated:", resp.read().decode("utf-8"))

time.sleep(2)

_, stdout, _ = ssh.exec_command("tail -n 8 /home/ritadmin/printpoint-kiosk/daemon.log")
print("\nPi Daemon Log after returning to 'home':\n", stdout.read().decode("utf-8"))

ssh.close()
