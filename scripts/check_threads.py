import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

cmd = "ls -la /proc/7813/task/"
stdin, stdout, stderr = client.exec_command(cmd)
print('TASKS of 7813:')
print(stdout.read().decode())
