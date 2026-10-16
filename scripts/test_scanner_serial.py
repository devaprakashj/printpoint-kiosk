import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

    script = """
import serial
import time
import sys

print("Opening /dev/ttyUSB0 (listening for 45 seconds)...", flush=True)
try:
    ser = serial.Serial('/dev/ttyUSB0', 9600, timeout=0.1)
    print("READY! Press the small black BUTTON on the scanner board while pointing at a QR code...", flush=True)
    start = time.time()
    buffer = b""
    while time.time() - start < 45:
        if ser.in_waiting > 0:
            raw = ser.read(ser.in_waiting)
            buffer += raw
            print(f"[RAW BYTE RECEIVED]: {raw}", flush=True)
            if b'\\r' in buffer or b'\\n' in buffer:
                print(f"\\n🎉 SUCCESS! DECODED DATA: {buffer.decode('utf-8', errors='replace').strip()}", flush=True)
                sys.exit(0)
        time.sleep(0.05)
    print("\\nListening finished.")
except Exception as e:
    print(f"Serial Error: {e}")
"""
    stdin, stdout, stderr = ssh.exec_command("cat << 'EOF' > /home/ritadmin/test_scan.py\n" + script + "\nEOF\npython3 /home/ritadmin/test_scan.py")
    out = stdout.read().decode('utf-8', errors='replace')
    print(out)
    ssh.close()
except Exception as e:
    print(f"Error: {e}")
