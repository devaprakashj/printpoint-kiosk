import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

pi_daemon = """#!/usr/bin/env python3
import os, select, sys, time, struct

log_file = open('/home/ritadmin/printpoint-kiosk/scanner_debug.log', 'a', buffering=1)

def log(msg):
    ts = time.strftime('%H:%M:%S')
    log_file.write(f"[{ts}] {msg}\\n")
    print(f"[{ts}] {msg}", flush=True)

log("=== SCANNER MULTI-CHANNEL LOGGER STARTED ===")

fds = {}
for p in ['/dev/input/event1', '/dev/hidraw0', '/dev/hidraw1']:
    if os.path.exists(p):
        try:
            fd = os.open(p, os.O_RDONLY | os.O_NONBLOCK)
            fds[fd] = p
            log(f"OPENED {p} (fd={fd})")
        except Exception as e:
            log(f"FAILED {p}: {e}")

while True:
    try:
        r, _, _ = select.select(list(fds.keys()), [], [], 2.0)
        for fd in r:
            path = fds[fd]
            try:
                data = os.read(fd, 256)
                if data:
                    if 'event' in path and len(data) >= 24:
                        sec, usec, ev_type, ev_code, ev_val = struct.unpack('qqHHi', data[:24])
                        log(f"EVENT: type={ev_type} code={ev_code} val={ev_val} (len={len(data)})")
                    else:
                        log(f"RAW DATA on {path} (len={len(data)}): {data.hex()} | {data}")
            except Exception as e:
                log(f"Read error on {path}: {e}")
    except Exception as e:
        log(f"Select loop error: {e}")
        time.sleep(1.0)
"""

sftp = client.open_sftp()
with sftp.file('/home/ritadmin/printpoint-kiosk/scanner_logger.py', 'w') as f:
    f.write(pi_daemon)
sftp.close()

# Kill any old instance and run in background with nohup as root
cmd = 'echo adminadmin | sudo -S pkill -f scanner_logger.py; sudo chmod 666 /dev/hidraw*; nohup sudo python3 /home/ritadmin/printpoint-kiosk/scanner_logger.py > /dev/null 2>&1 &'
stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode())

time.sleep(1.0)
stdin, stdout, stderr = client.exec_command('cat /home/ritadmin/printpoint-kiosk/scanner_debug.log | tail -n 10')
print('LOG OUTPUT:')
print(stdout.read().decode())
client.close()
