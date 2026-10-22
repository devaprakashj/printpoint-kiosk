import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

stdin, stdout, stderr = client.exec_command('wc -l /home/ritadmin/printpoint-kiosk/daemon.log')
print('wc -l:', stdout.read().decode('utf-8', errors='ignore'))

stdin, stdout, stderr = client.exec_command('sed -n "550,575p" /home/ritadmin/printpoint-kiosk/daemon.log')
print('lines around 556:\n', stdout.read().decode('utf-8', errors='ignore'))

stdin, stdout, stderr = client.exec_command('tail -n 20 /home/ritadmin/printpoint-kiosk/daemon.log')
print('tail:\n', stdout.read().decode('utf-8', errors='ignore'))

client.close()
