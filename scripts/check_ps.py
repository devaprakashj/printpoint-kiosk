import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

cmd = "ps aux | grep smartprint_daemon"
stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode())
