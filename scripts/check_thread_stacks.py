import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

cmd = '''python3 -c "
import os
for tid in os.listdir('/proc/9484/task'):
    wchan = ''
    try:
        with open(f'/proc/9484/task/{tid}/wchan') as f:
            wchan = f.read().strip()
    except: pass
    stack = ''
    try:
        with open(f'/proc/9484/task/{tid}/stack') as f:
            stack = f.read().strip()
    except: pass
    print(f'TID {tid}: wchan={wchan}')
    if stack:
        print('  ' + stack.replace('\\n', '\\n  '))
"'''
stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='ignore'))
print(stderr.read().decode('utf-8', errors='ignore'))

client.close()
