import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

pi_code = """
import os, select, sys, time

# Open event1, hidraw0, hidraw1
fds = {}
for path in ['/dev/input/event1', '/dev/hidraw0', '/dev/hidraw1']:
    if os.path.exists(path):
        try:
            fd = os.open(path, os.O_RDONLY | os.O_NONBLOCK)
            fds[fd] = path
            print(f"SUCCESS OPENED {path} (fd={fd})")
        except Exception as e:
            print(f"FAILED {path}: {e}")

print("LISTENING ON ALL 3 CHANNELS (event1, hidraw0, hidraw1) FOR 35 SECONDS...")
print("PLEASE SCAN YOUR ORDER QR CODE NOW!")
start = time.time()
events_received = 0
while time.time() - start < 35:
    r, _, _ = select.select(list(fds.keys()), [], [], 0.5)
    for fd in r:
        try:
            data = os.read(fd, 256)
            path = fds[fd]
            events_received += 1
            print(f"--> RECEIVED on {path} (len={len(data)}): {data}")
        except Exception as e:
            print(f"Read error on {fds[fd]}: {e}")

for fd in fds:
    os.close(fd)
print(f"TEST FINISHED. Total events received: {events_received}")
"""

sftp = client.open_sftp()
with sftp.file('/home/ritadmin/printpoint-kiosk/test_read_all.py', 'w') as f:
    f.write(pi_code)
sftp.close()

stdin, stdout, stderr = client.exec_command('echo adminadmin | sudo -S chmod 666 /dev/hidraw* && echo adminadmin | sudo -S python3 /home/ritadmin/printpoint-kiosk/test_read_all.py')
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))
client.close()
