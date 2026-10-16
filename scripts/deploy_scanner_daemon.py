import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

    daemon_code = """import serial
import time
import sys

SERIAL_PORT = '/dev/ttyUSB0'
BAUD_RATE = 9600
OUT_FILE = '/home/ritadmin/scanned.txt'

print(f"Starting Scanner Listener on {SERIAL_PORT} @ {BAUD_RATE}...", flush=True)
try:
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=0.05)
    with open(OUT_FILE, 'w') as f:
        f.write(f"READY at {time.strftime('%H:%M:%S')}\\n")
        f.flush()

    buffer = b""
    while True:
        if ser.in_waiting > 0:
            chunk = ser.read(ser.in_waiting)
            buffer += chunk
            with open(OUT_FILE, 'a') as f:
                f.write(f"[RAW {time.strftime('%H:%M:%S')}]: {chunk}\\n")
                f.flush()
            if b'\\r' in buffer or b'\\n' in buffer:
                line = buffer.decode('utf-8', errors='replace').strip()
                if line:
                    with open(OUT_FILE, 'a') as f:
                        f.write(f"[SCANNED_ORDER_DATA]: {line}\\n")
                        f.flush()
                    print(f"\\n🎯 SCANNED: {line}", flush=True)
                buffer = b""
        time.sleep(0.02)
except Exception as e:
    print(f"Error: {e}", flush=True)
    with open(OUT_FILE, 'a') as f:
        f.write(f"ERROR: {e}\\n")
"""
    stdin, stdout, stderr = ssh.exec_command("cat << 'EOF' > /home/ritadmin/scanner_daemon.py\n" + daemon_code + "\nEOF")
    stdout.read()
    print("scanner_daemon.py written to Pi successfully!")
    
    # Start it in the background on Pi
    stdin, stdout, stderr = ssh.exec_command("pkill -f scanner_daemon.py 2>/dev/null; nohup python3 /home/ritadmin/scanner_daemon.py > /home/ritadmin/scanner.log 2>&1 & sleep 1; ps aux | grep scanner_daemon")
    out = stdout.read().decode('utf-8', errors='replace')
    print("Running process:")
    print(out)
    ssh.close()
except Exception as e:
    print(f"Error: {e}")
