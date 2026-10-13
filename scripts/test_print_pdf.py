import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=8)

test_code = """
import subprocess
import time
import re

# Download valid PDF
import urllib.request
url = 'https://printpoint-kiosk.vercel.app/api/documents/download?path=orders/01eb43e1-cd0f-4797-8a21-eaf5ea559893/RIT_PrintPoint_5971.pdf'
req = urllib.request.Request(url, headers={'User-Agent': 'SmartPrint/1.0'})
resp = urllib.request.urlopen(req)
pdf_bytes = resp.read()
with open('/tmp/RIT_PrintPoint_5971.pdf', 'wb') as f:
    f.write(pdf_bytes)
print('Saved /tmp/RIT_PrintPoint_5971.pdf (', len(pdf_bytes), 'bytes)')

# Run lp command
cmd = [
    'lp', '-c', '-d', 'Kyocera_3212i',
    '-o', 'media=A4', '-o', 'PageSize=A4',
    '-o', 'InputSlot=Auto', '-o', 'MediaType=Auto',
    '-o', 'fit-to-page',
    '/tmp/RIT_PrintPoint_5971.pdf'
]
res = subprocess.run(cmd, capture_output=True, text=True)
print('lp stdout:', res.stdout.strip())
if res.stderr:
    print('lp stderr:', res.stderr.strip())

match = re.search(r'request id is ([^\s]+)', res.stdout)
if match:
    job_id = match.group(1)
    print('Tracking job:', job_id)
    for i in range(15):
        time.sleep(0.5)
        stat = subprocess.run(['lpstat', '-l', '-W', 'not-completed', '-o', 'Kyocera_3212i'], capture_output=True, text=True).stdout
        if job_id not in stat:
            print('SUCCESS: Job departed queue and sent to Kyocera printer hardware!')
            break
        print(f'Attempt {i}: still in queue -> {stat.strip()}')

time.sleep(1)
comp = subprocess.run(['lpstat', '-W', 'completed', '-o', 'Kyocera_3212i'], capture_output=True, text=True).stdout
print('Recent completed jobs:\\n' + comp)
"""

sftp = ssh.open_sftp()
with sftp.file('/home/ritadmin/printpoint-kiosk/test_print_pdf.py', 'w') as f:
    f.write(test_code)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('python3 /home/ritadmin/printpoint-kiosk/test_print_pdf.py')
print("OUTPUT:\n", stdout.read().decode())
print("ERR:\n", stderr.read().decode())

ssh.close()
