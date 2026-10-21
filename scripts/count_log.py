import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

cmd = "wc -l /home/ritadmin/printpoint-kiosk/daemon.log"
stdin, stdout, stderr = client.exec_command(cmd)
print('TOTAL LINES:', stdout.read().decode())
