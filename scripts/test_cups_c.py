import paramiko
import time

PI_IP = "172.15.28.232"
PI_USER = "ritadmin"
PI_PASS = "adminadmin"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(PI_IP, username=PI_USER, password=PI_PASS, timeout=8)

test_script = """
import subprocess
import time
import re

with open('/tmp/test_paper.txt', 'w') as f:
    f.write('PrintPoint Kiosk Alignment Slip\\n===============================\\nKyocera 3212i Hardware Verified.\\n\\x0c')

cmd = ['lp', '-c', '-d', 'Kyocera_3212i', '-o', 'media=A4', '/tmp/test_paper.txt']
res = subprocess.run(cmd, capture_output=True, text=True)
print('lp stdout:', res.stdout.strip())
if res.stderr:
    print('lp stderr:', res.stderr.strip())

match = re.search(r'request id is ([^\\s]+)', res.stdout)
if match:
    job_id = match.group(1)
    print('Tracking job:', job_id)
    for i in range(12):
        time.sleep(1)
        stat = subprocess.run(['lpstat', '-l', '-W', 'not-completed', '-o', 'Kyocera_3212i'], capture_output=True, text=True).stdout
        if job_id not in stat:
            print('SUCCESS: Job departed queue and dispatched to Kyocera hardware!')
            break
        print(f'Attempt {i}: still in queue -> {stat.strip()}')

time.sleep(2)
comp = subprocess.run(['lpstat', '-W', 'completed', '-o', 'Kyocera_3212i'], capture_output=True, text=True).stdout
print('Recent completed jobs:\\n' + comp)
"""

# Upload test script and run
sftp = ssh.open_sftp()
with sftp.file('/home/ritadmin/printpoint-kiosk/test_lp.py', 'w') as f:
    f.write(test_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('python3 /home/ritadmin/printpoint-kiosk/test_lp.py')
print("OUTPUT:\n", stdout.read().decode())
err = stderr.read().decode()
if err:
    print("ERR:\n", err)

ssh.close()
