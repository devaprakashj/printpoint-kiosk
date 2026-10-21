import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

pi_script = """
import os, time, select

# Open hidraw0 with non-blocking
fd = os.open('/dev/hidraw0', os.O_RDWR | os.O_NONBLOCK)
print('Opened /dev/hidraw0 successfully fd=', fd)

def send_cmd(cmd_str):
    data = cmd_str.encode('utf-8')
    try:
        # Standard HID report might need 0x00 prefix or raw bytes
        written = os.write(fd, data)
        print(f"Sent: {cmd_str.strip()} ({written} bytes)")
    except Exception as e:
        print(f"Write error for {cmd_str.strip()}: {e}")

# Try unlock, induction night fill off, and save
send_cmd('~M00910001.')
time.sleep(0.3)
send_cmd('~M00260000.')
time.sleep(0.3)
send_cmd('~M01260000.')
time.sleep(0.3)
send_cmd('~M01030000.')
time.sleep(0.3)
send_cmd('~M01050000.')
time.sleep(0.3)
send_cmd('~MA5F0506A.')
time.sleep(0.3)
send_cmd('~M00910000.')

# Check for response
r, w, x = select.select([fd], [], [], 1.0)
if r:
    res = os.read(fd, 64)
    print("Response received:", res)
else:
    print("No immediate response on hidraw0")

os.close(fd)
"""

sftp = client.open_sftp()
with sftp.file('/home/ritadmin/printpoint-kiosk/test_hidraw.py', 'w') as f:
    f.write(pi_script)
sftp.close()

stdin, stdout, stderr = client.exec_command('echo adminadmin | sudo -S python3 /home/ritadmin/printpoint-kiosk/test_hidraw.py')
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))
client.close()
