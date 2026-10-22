import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

for dev in ['/dev/input/event5', '/dev/hidraw0', '/dev/hidraw1']:
    print(f"=== fuser {dev} ===")
    stdin, stdout, stderr = client.exec_command(f'fuser -v {dev}')
    print(stdout.read().decode('utf-8', errors='ignore'))
    print(stderr.read().decode('utf-8', errors='ignore'))

client.close()
