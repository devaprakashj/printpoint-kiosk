import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

    script = """
import serial
import time
import os
import glob
import sys

print("=== SCANNER DIAGNOSTIC MONITOR ===", flush=True)

# 1. Check all serial ports
serial_ports = glob.glob('/dev/ttyUSB*') + glob.glob('/dev/ttyACM*')
print(f"Detected Serial Ports: {serial_ports}", flush=True)

# 2. Check input devices (Keyboards/HID)
input_devices = glob.glob('/dev/input/by-id/*')
print(f"Detected Input/HID Devices: {input_devices}", flush=True)

ser = None
if '/dev/ttyUSB0' in serial_ports:
    try:
        ser = serial.Serial('/dev/ttyUSB0', 9600, timeout=0.1)
        print("Connected to /dev/ttyUSB0 at 9600 baud.", flush=True)
    except Exception as e:
        print(f"Serial open error: {e}", flush=True)

print("\\nREADY! Scan a barcode/QR code now (listening for 60 seconds)...", flush=True)
start = time.time()
while time.time() - start < 60:
    if ser and ser.in_waiting > 0:
        raw = ser.read(ser.in_waiting)
        print(f"\\n🎉 DATA RECEIVED FROM SERIAL: {raw}", flush=True)
        try:
            print(f"DECODED TEXT: {raw.decode('utf-8', errors='replace').strip()}", flush=True)
        except:
            pass
        sys.exit(0)
    time.sleep(0.05)

print("\\nDiagnostic Finished.")
"""
    stdin, stdout, stderr = ssh.exec_command("cat << 'EOF' > /home/ritadmin/diag_scan.py\n" + script + "\nEOF\npython3 /home/ritadmin/diag_scan.py")
    out = stdout.read().decode('utf-8', errors='replace')
    print(out)
    ssh.close()
except Exception as e:
    print(f"Error: {e}")
