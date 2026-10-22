import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

monitor_script = '''#!/usr/bin/env python3
import os, select, sys, time, struct

log_path = "/home/ritadmin/live_scan.log"
with open(log_path, "w") as f:
    f.write("MONITOR STARTED AT " + time.strftime("%H:%M:%S") + "\\n")

fds = {}
for p in ["/dev/input/event5", "/dev/hidraw0", "/dev/hidraw1"]:
    if os.path.exists(p):
        try:
            fd = os.open(p, os.O_RDONLY | os.O_NONBLOCK)
            fds[fd] = p
            with open(log_path, "a") as f:
                f.write(f"OPENED {p} fd={fd}\\n")
        except Exception as e:
            with open(log_path, "a") as f:
                f.write(f"FAILED {p}: {e}\\n")

start = time.time()
while time.time() - start < 120:
    r, _, _ = select.select(list(fds.keys()), [], [], 0.5)
    for fd in r:
        path = fds[fd]
        try:
            data = os.read(fd, 256)
            if data:
                with open(log_path, "a") as f:
                    f.write(f"[{time.strftime('%H:%M:%S')}] READ from {path} (len={len(data)}): {data.hex()}\\n")
        except Exception as e:
            with open(log_path, "a") as f:
                f.write(f"ERROR reading {path}: {e}\\n")

with open(log_path, "a") as f:
    f.write("MONITOR COMPLETED AT " + time.strftime("%H:%M:%S") + "\\n")
'''

sftp = client.open_sftp()
with sftp.file('/home/ritadmin/run_live_monitor.py', 'w') as f:
    f.write(monitor_script)
sftp.chmod('/home/ritadmin/run_live_monitor.py', 0o755)
sftp.close()

# Start it in background
stdin, stdout, stderr = client.exec_command('nohup python3 /home/ritadmin/run_live_monitor.py >/dev/null 2>&1 &')
stdout.read()

stdin, stdout, stderr = client.exec_command('cat /home/ritadmin/live_scan.log')
print('LIVE SCAN LOG:\n', stdout.read().decode())

client.close()
