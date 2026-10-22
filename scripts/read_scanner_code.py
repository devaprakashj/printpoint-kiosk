import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

stdin, stdout, stderr = client.exec_command('python3 -c "with open(\'/home/ritadmin/printpoint-kiosk/smartprint_daemon.py\') as f: lines = f.readlines(); print(\'\'.join(lines[1260:1320]))"')
print(stdout.read().decode('utf-8', errors='ignore'))
client.close()
