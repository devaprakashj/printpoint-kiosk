import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=8)

test_code = """
import urllib.request
import subprocess
import time
import re

# Download order 6171 PNG
url = 'https://printpoint-kiosk.vercel.app/api/documents/download?path=orders/5f164d98-c922-42fb-8416-b2f3e10ec0c8/1791863698044_SmartPrint_Receipt_ORD-20261011-6668__2_.png'
req = urllib.request.Request(url, headers={'User-Agent': 'SmartPrint/1.0'})
data = urllib.request.urlopen(req).read()
with open('/tmp/receipt_6171.png', 'wb') as f:
    f.write(data)
print('Saved /tmp/receipt_6171.png (bytes:', len(data), ')')

# Test lp command on the PNG
cmd = [
    'lp', '-c', '-d', 'Kyocera_3212i',
    '-o', 'media=A4', '-o', 'PageSize=A4',
    '-o', 'InputSlot=Auto', '-o', 'MediaType=Auto',
    '-o', 'fit-to-page',
    '/tmp/receipt_6171.png'
]
res = subprocess.run(cmd, capture_output=True, text=True)
print('lp stdout:', res.stdout.strip())
print('lp stderr:', res.stderr.strip())

match = re.search(r'request id is ([^\s]+)', res.stdout)
if match:
    job_id = match.group(1)
    print('Tracking job:', job_id)
    for i in range(12):
        time.sleep(0.5)
        stat = subprocess.run(['lpstat', '-l', '-W', 'not-completed', '-o', 'Kyocera_3212i'], capture_output=True, text=True).stdout
        if job_id not in stat:
            print('SUCCESS: PNG Job departed queue and sent to Kyocera hardware!')
            break
        print(f'Attempt {i}: still in queue -> {stat.strip()}')

comp = subprocess.run(['lpstat', '-W', 'completed', '-o', 'Kyocera_3212i'], capture_output=True, text=True).stdout
print('Recent completed jobs:\\n' + comp)
"""

sftp = ssh.open_sftp()
with sftp.file('/home/ritadmin/printpoint-kiosk/test_print_png.py', 'w') as f:
    f.write(test_code)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('python3 /home/ritadmin/printpoint-kiosk/test_print_png.py')
print("OUTPUT:\n", stdout.read().decode())
print("ERR:\n", stderr.read().decode())

ssh.close()
