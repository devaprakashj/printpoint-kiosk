import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

checks = [
    ("1. SMARTPRINT HARDWARE DAEMON SERVICE", "systemctl status smartprint.service --no-pager"),
    ("2. SMARTPRINT FULLSCREEN KIOSK DISPLAY SERVICE", "systemctl status smartprint-kiosk.service --no-pager"),
    ("3. CUPS PRINTER STATUS (Kyocera 3212i)", "lpstat -p -d; echo '---'; lpstat -r"),
    ("4. USB SCANNER HARDWARE DETECTION", "lsusb | grep -i 1a86; ls -l /dev/input/by-id/*Serial_To_HID*"),
    ("5. PROCESS AUDIT (Python Daemon & Chromium)", "ps aux | grep -E 'smartprint_daemon|chromium' | grep -v grep"),
    ("6. LOCAL WEBSOCKET & NETWORK PORTS", "ss -tlpn | grep -E '8765|631'"),
    ("7. PI SYSTEM HEALTH (CPU Temp, RAM, Disk)", "vcgencmd measure_temp 2>/dev/null || cat /sys/class/thermal/thermal_zone0/temp; free -h; df -h /"),
    ("8. RECENT DAEMON LOG PULSES & ACTIVITY", "tail -n 12 /home/ritadmin/printpoint-kiosk/daemon.log")
]

print("==================================================================")
print("       RASPBERRY PI 5 KIOSK HARDWARE COMPREHENSIVE AUDIT         ")
print("==================================================================")

for title, cmd in checks:
    print(f"\n>>> {title}")
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out)
    if err and not out:
        print(f"[STDERR]: {err}")

client.close()
print("\n==================================================================")
print("                     AUDIT COMPLETE                              ")
print("==================================================================")
