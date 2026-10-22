import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

stdin, stdout, stderr = client.exec_command('grep -i "QR SCANNED" /home/ritadmin/printpoint-kiosk/daemon.log')
out = stdout.read().decode('utf-8', errors='ignore')
print('Matches for QR SCANNED:', out if out else 'NONE')

stdin, stdout, stderr = client.exec_command('grep -i "VERIFYING ORDER" /home/ritadmin/printpoint-kiosk/daemon.log')
out2 = stdout.read().decode('utf-8', errors='ignore')
print('Matches for VERIFYING ORDER:', out2 if out2 else 'NONE')

client.close()
