import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

for filename in ['test_read_all.py', 'test_hidraw.py']:
    print(f"=== {filename} ===")
    stdin, stdout, stderr = client.exec_command(f'cat /home/ritadmin/printpoint-kiosk/{filename}')
    print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
