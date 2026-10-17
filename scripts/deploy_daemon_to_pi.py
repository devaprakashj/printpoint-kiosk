import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

print("Uploading updated smartprint_daemon.py to Raspberry Pi...")
sftp = client.open_sftp()
sftp.put('kiosk-client/smartprint_daemon.py', '/home/ritadmin/printpoint-kiosk/smartprint_daemon.py')
sftp.close()

print("Restarting smartprint.service on Raspberry Pi...")
stdin, stdout, stderr = client.exec_command('echo adminadmin | sudo -S systemctl restart smartprint.service && sleep 2 && systemctl status smartprint.service --no-pager')
print(stdout.read().decode('utf-8'))

client.close()
print("Daemon successfully updated and restarted on Raspberry Pi!")
