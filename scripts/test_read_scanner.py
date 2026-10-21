import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

cmd = """python3 -c "
import glob, struct, os, time, sys

devs = glob.glob('/dev/input/by-id/*Serial_To_HID*')
print('DEVS FOUND:', devs)
if not devs:
    sys.exit(1)

dev_path = devs[0]
print('OPENING:', dev_path)
with open(dev_path, 'rb') as f:
    print('SUCCESS! WAITING 5 SECONDS FOR EVENTS...')
    start = time.time()
    # non-blocking test
    import fcntl
    fcntl.fcntl(f, fcntl.F_SETFL, os.O_NONBLOCK)
    while time.time() - start < 5:
        try:
            data = f.read(24)
            if data:
                sec, usec, ev_type, ev_code, ev_val = struct.unpack('qqHHi', data)
                print(f'EV: type={ev_type} code={ev_code} val={ev_val}')
        except BlockingIOError:
            time.sleep(0.05)
    print('TEST DONE.')
"
"""
stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode())
print(stderr.read().decode())
