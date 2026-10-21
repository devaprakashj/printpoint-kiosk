import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

cmd = "ps aux | grep -E 'chromium|chrome|firefox|wayfire|labwc|Xorg|cage|kiosk'"
stdin, stdout, stderr = client.exec_command(cmd)
print('GUI PROCESSES:')
print(stdout.read().decode())
