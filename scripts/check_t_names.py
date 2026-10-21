import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

cmd = "cat /proc/7813/task/*/comm"
stdin, stdout, stderr = client.exec_command(cmd)
print('THREAD NAMES:')
print(stdout.read().decode())
