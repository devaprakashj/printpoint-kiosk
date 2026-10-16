import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

    script = """import serial
import time
import sys

print("Opening /dev/ttyUSB0...", flush=True)
ser = serial.Serial('/dev/ttyUSB0', 9600, timeout=0.05)
print(">>> READY! PRESS BUTTON AND SCAN A QR CODE NOW (20 SECONDS) <<<", flush=True)

start = time.time()
while time.time() - start < 20:
    n = ser.in_waiting
    if n > 0:
        data = ser.read(n)
        print(f"\\n🎯 RECEIVED {len(data)} BYTES: {data}", flush=True)
        print(f"TEXT: {data.decode('utf-8', errors='replace')}", flush=True)
        sys.exit(0)
    time.sleep(0.01)

print("No data received in 20 seconds.")
"""
    stdin, stdout, stderr = ssh.exec_command("cat << 'EOF' > /home/ritadmin/listen_now.py\n" + script + "\nEOF")
    stdout.read()
    print("Script written.")
    ssh.close()
except Exception as e:
    print(f"Error: {e}")
