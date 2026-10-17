import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

sftp = client.open_sftp()
sftp.put('scripts/test_kyocera_query.py', '/home/ritadmin/test_kyocera_query.py')
sftp.close()

stdin, stdout, stderr = client.exec_command('python3 /home/ritadmin/test_kyocera_query.py')
print(stdout.read().decode('utf-8'))
client.close()
