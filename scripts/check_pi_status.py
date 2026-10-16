import paramiko
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)
    
    stdin, stdout, _ = ssh.exec_command('systemctl is-active smartprint.service')
    print("smartprint.service active:", stdout.read().decode('utf-8').strip())

    stdin, stdout, _ = ssh.exec_command('ps aux | grep -iE "chromium|kiosk"')
    print("\nBrowser/Kiosk processes:")
    print(stdout.read().decode('utf-8').strip())

    stdin, stdout, _ = ssh.exec_command('cat /home/ritadmin/printpoint-kiosk/daemon.log 2>/dev/null | tail -5')
    print("\nRecent Daemon Log:")
    print(stdout.read().decode('utf-8').strip())

    ssh.close()
except Exception as e:
    print(f"Error: {e}")
