import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

for cmd in ['which grim', 'which wlr-randr']:
    stdin, stdout, stderr = client.exec_command(cmd)
    print(cmd, '->', stdout.read().decode().strip())

client.close()
