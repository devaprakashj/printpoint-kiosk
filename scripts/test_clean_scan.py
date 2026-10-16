import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

    script = """import serial
import time
import sys

print("PORT /dev/ttyUSB0 OPENED! LISTENING FOR 30 SECONDS...", flush=True)
try:
    ser = serial.Serial('/dev/ttyUSB0', 9600, timeout=0.1)
    ser.reset_input_buffer()
    start = time.time()
    buffer = b""
    while time.time() - start < 30:
        if ser.in_waiting > 0:
            b = ser.read(ser.in_waiting)
            buffer += b
            print(f"[BYTE ARRIVED]: {b}", flush=True)
            if b'\\r' in buffer or b'\\n' in buffer:
                decoded = buffer.decode('utf-8', errors='replace').strip()
                print(f"\\n🎉🎉🎉 SUCCESS! SCANNED QR CODE: {decoded}", flush=True)
                sys.exit(0)
        time.sleep(0.01)
    print("Timeout: No bytes received.")
except Exception as e:
    print(f"Error: {e}")
"""
    stdin, stdout, stderr = ssh.exec_command("cat << 'EOF' > /home/ritadmin/clean_scan.py\n" + script + "\nEOF\npython3 /home/ritadmin/clean_scan.py")
    out = stdout.read().decode('utf-8', errors='replace')
    print(out)
    ssh.close()
except Exception as e:
    print(f"Error: {e}")
