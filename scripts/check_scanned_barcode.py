import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

stdin, stdout, stderr = client.exec_command('cat /home/ritadmin/scanned_barcode.txt 2>/dev/null')
print('scanned_barcode.txt:\n', stdout.read().decode('utf-8', errors='ignore'))

client.close()
