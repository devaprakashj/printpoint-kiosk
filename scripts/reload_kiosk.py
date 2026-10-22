import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

print('Clearing Chromium cache on Pi...')
client.exec_command('rm -rf /home/ritadmin/.config/chromium-kiosk/Default/Cache* /home/ritadmin/.config/chromium-kiosk/Default/Code\\ Cache*')

print('Restarting smartprint-kiosk.service...')
stdin, stdout, stderr = client.exec_command('echo adminadmin | sudo -S systemctl restart smartprint-kiosk.service')
print(stdout.read().decode())

import time
time.sleep(2)
stdin, stdout, stderr = client.exec_command('systemctl status smartprint-kiosk.service --no-pager')
print(stdout.read().decode())

client.close()
