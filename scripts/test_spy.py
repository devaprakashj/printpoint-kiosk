import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

    script = """
import serial
import time
import sys

print("Connecting to /dev/ttyUSB0...", flush=True)

for baud in [9600, 115200, 19200, 38400, 57600]:
    try:
        ser = serial.Serial('/dev/ttyUSB0', baud, timeout=0.05)
        ser.reset_input_buffer()
        print(f"\\n>>> LISTENING AT {baud} BAUD FOR 15s... (SCAN 2 TIMES NOW!) <<<", flush=True)
        start = time.time()
        while time.time() - start < 15:
            if ser.in_waiting > 0:
                raw = ser.read(ser.in_waiting)
                print(f"\\n💥 [SUCCESS AT {baud} BAUD!]", flush=True)
                print(f"RAW BYTES: {raw}", flush=True)
                print(f"ASCII TEXT: {raw.decode('utf-8', errors='replace').strip()}", flush=True)
                sys.exit(0)
            time.sleep(0.01)
        ser.close()
    except Exception as e:
        print(f"Error at {baud}: {e}")

print("\\nNo bytes received across standard bauds.")
"""
    stdin, stdout, stderr = ssh.exec_command("cat << 'EOF' > /home/ritadmin/spy_scan.py\n" + script + "\nEOF\npython3 /home/ritadmin/spy_scan.py")
    out = stdout.read().decode('utf-8', errors='replace')
    print(out)
    ssh.close()
except Exception as e:
    print(f"Error: {e}")
