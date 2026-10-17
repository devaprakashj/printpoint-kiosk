import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

pi_code = """
import glob, os

print("--- INPUT DEVICES ---")
for p in sorted(glob.glob('/dev/input/event*')):
    base = os.path.basename(p)
    name_path = f'/sys/class/input/{base}/device/name'
    name = open(name_path).read().strip() if os.path.exists(name_path) else 'unknown'
    print(f"{p} -> {name}")

print("--- BY-ID ---")
for p in glob.glob('/dev/input/by-id/*'):
    target = os.path.realpath(p)
    print(f"{p} -> {target}")

print("--- HIDRAW ---")
for h in sorted(glob.glob('/dev/hidraw*')):
    print(f"{h}")
"""

sftp = client.open_sftp()
with sftp.file('/home/ritadmin/printpoint-kiosk/inspect_inputs.py', 'w') as f:
    f.write(pi_code)
sftp.close()

stdin, stdout, stderr = client.exec_command('python3 /home/ritadmin/printpoint-kiosk/inspect_inputs.py')
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))
client.close()
