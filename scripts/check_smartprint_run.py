import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

stdin, stdout, stderr = client.exec_command('journalctl -u smartprint.service -S "2026-10-22 09:25:00" --no-pager')
print('journalctl smartprint:\n', stdout.read().decode('utf-8', errors='ignore'))

stdin, stdout, stderr = client.exec_command('ls -l /proc/9484/fd')
print('process 9484 file descriptors:\n', stdout.read().decode('utf-8', errors='ignore'))

client.close()
