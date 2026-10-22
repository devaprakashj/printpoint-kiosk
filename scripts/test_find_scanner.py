import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

cmd = '''python3 -c "
import sys
sys.path.insert(0, '/home/ritadmin/printpoint-kiosk')
from smartprint_daemon import find_scanner_input_device
print('FOUND SCANNER DEV:', find_scanner_input_device())
"'''
stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='ignore'))
print(stderr.read().decode('utf-8', errors='ignore'))

client.close()
