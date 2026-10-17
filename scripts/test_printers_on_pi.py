import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

stdin, stdout, stderr = client.exec_command("python3 -c \"import sys; sys.path.insert(0, '/home/ritadmin/printpoint-kiosk'); import smartprint_daemon; print(smartprint_daemon.detect_connected_printers('Kyocera_3212i'))\"")
print("Output:", stdout.read().decode('utf-8'))
print("Error:", stderr.read().decode('utf-8'))
client.close()
