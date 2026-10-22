import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

print("1. Clearing Chromium cache to ensure fresh Vercel bundle loads...")
cmd_clear_cache = """
echo adminadmin | sudo -S rm -rf /home/ritadmin/.config/chromium-kiosk/Default/Cache/* /home/ritadmin/.config/chromium-kiosk/Default/Code\ Cache/*
"""
stdin, stdout, stderr = client.exec_command(cmd_clear_cache)
stdout.read()

print("2. Uploading latest smartprint_daemon.py...")
sftp = client.open_sftp()
sftp.put('d:/print atm/kiosk-client/smartprint_daemon.py', '/home/ritadmin/printpoint-kiosk/smartprint_daemon.py')
sftp.chmod('/home/ritadmin/printpoint-kiosk/smartprint_daemon.py', 0o755)
sftp.close()

print("3. Restarting smartprint.service (hardware daemon)...")
stdin, stdout, stderr = client.exec_command("echo adminadmin | sudo -S systemctl restart smartprint.service")
stdout.read()

time.sleep(2)

print("4. Restarting smartprint-kiosk.service (Chromium display)...")
stdin, stdout, stderr = client.exec_command("echo adminadmin | sudo -S systemctl restart smartprint-kiosk.service")
stdout.read()

time.sleep(4)

print("5. Verifying services status:")
for svc in ['smartprint.service', 'smartprint-kiosk.service']:
    stdin, stdout, stderr = client.exec_command(f"systemctl is-active {svc}")
    print(f"  - {svc}: {stdout.read().decode().strip()}")

client.close()
print("All refreshed!")
