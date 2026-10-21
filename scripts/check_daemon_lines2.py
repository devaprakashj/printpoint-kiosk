import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

cmd = """python3 -c "
with open('/home/ritadmin/printpoint-kiosk/smartprint_daemon.py') as f:
    lines = f.readlines()
print(''.join(lines[655:720]))
"
"""
stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode())
print(stderr.read().decode())
