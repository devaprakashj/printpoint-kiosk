import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

cmd = '''python3 -c "
import os
for tid in os.listdir('/proc/9484/task'):
    with open(f'/proc/9484/task/{tid}/comm') as f:
        print(tid, f.read().strip())
"'''
stdin, stdout, stderr = client.exec_command(cmd)
print('Threads in 9484:\n', stdout.read().decode('utf-8', errors='ignore'))

client.close()
