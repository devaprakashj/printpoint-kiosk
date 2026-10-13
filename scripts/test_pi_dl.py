import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=8)

test_code = """
import urllib.request
url = 'https://printpoint-kiosk.vercel.app/api/documents/download?path=orders/01eb43e1-cd0f-4797-8a21-eaf5ea559893/RIT_PrintPoint_5971.pdf'
req = urllib.request.Request(url, headers={'User-Agent': 'SmartPrint/1.0'})
resp = urllib.request.urlopen(req)
data = resp.read()
print('Direct from Pi downloaded bytes:', len(data))
print('Data header:', data[:15])
"""

sftp = ssh.open_sftp()
with sftp.file('/home/ritadmin/printpoint-kiosk/test_dl.py', 'w') as f:
    f.write(test_code)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('python3 /home/ritadmin/printpoint-kiosk/test_dl.py')
print("OUTPUT:\n", stdout.read().decode())
print("ERR:\n", stderr.read().decode())

ssh.close()
