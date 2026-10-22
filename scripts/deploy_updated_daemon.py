import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

print('Uploading updated smartprint_daemon.py to Pi...')
sftp = client.open_sftp()
sftp.put('d:/print atm/kiosk-client/smartprint_daemon.py', '/home/ritadmin/printpoint-kiosk/smartprint_daemon.py')
sftp.chmod('/home/ritadmin/printpoint-kiosk/smartprint_daemon.py', 0o755)
sftp.close()
print('Upload complete!')

print('Restarting smartprint.service...')
stdin, stdout, stderr = client.exec_command('echo adminadmin | sudo -S systemctl restart smartprint.service')
print(stdout.read().decode())
print(stderr.read().decode())

import time
time.sleep(2)
stdin, stdout, stderr = client.exec_command('systemctl status smartprint.service --no-pager')
print(stdout.read().decode())

client.close()
