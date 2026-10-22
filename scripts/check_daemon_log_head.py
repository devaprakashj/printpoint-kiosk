import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

stdin, stdout, stderr = client.exec_command('grep -n "HARDWARE SCANNER" /home/ritadmin/printpoint-kiosk/smartprint_daemon.py')
print('smartprint_daemon.py lines:', stdout.read().decode('utf-8', errors='ignore'))

stdin, stdout, stderr = client.exec_command('head -n 40 /home/ritadmin/printpoint-kiosk/daemon.log')
print('head of daemon.log:', stdout.read().decode('utf-8', errors='ignore'))

client.close()
