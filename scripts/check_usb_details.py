import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

cmd = "lsusb -v -d 1a86: 2>/dev/null || lsusb"
stdin, stdout, stderr = client.exec_command(cmd)
print('LSUSB:')
print(stdout.read().decode())
cmd2 = "ls -la /dev/ttyUSB* /dev/ttyACM* 2>/dev/null"
stdin, stdout, stderr = client.exec_command(cmd2)
print('SERIAL PORTS:')
print(stdout.read().decode())
