import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

cmd = '''python3 -c "
import os, select
try:
    fd = os.open('/dev/input/event5', os.O_RDONLY | os.O_NONBLOCK)
    print('SUCCESS OPENED /dev/input/event5, fd=', fd)
    r, _, _ = select.select([fd], [], [], 1.0)
    print('SELECT RETURNED:', r)
    os.close(fd)
except Exception as e:
    print('ERROR:', e)
"'''
stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='ignore'))
print(stderr.read().decode('utf-8', errors='ignore'))

client.close()
