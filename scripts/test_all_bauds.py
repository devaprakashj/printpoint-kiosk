import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

    script = """
import serial
import time

bauds = [9600, 115200, 19200, 38400, 57600, 4800]
trigger_cmd = bytes.fromhex('7E 00 08 01 00 02 01 AB CD')
query_cmd = bytes.fromhex('7E 00 07 01 00 00 01 AB CD')

found = False
for b in bauds:
    try:
        ser = serial.Serial('/dev/ttyUSB0', b, timeout=0.2)
        # Flush
        ser.reset_input_buffer()
        ser.reset_output_buffer()
        # Send trigger
        ser.write(trigger_cmd)
        time.sleep(0.15)
        if ser.in_waiting > 0:
            resp = ser.read(ser.in_waiting)
            print(f"Baud rate MATCH! {b} -> Response: {resp.hex()}", flush=True)
            found = True
            ser.close()
            break
        # Send query
        ser.write(query_cmd)
        time.sleep(0.15)
        if ser.in_waiting > 0:
            resp = ser.read(ser.in_waiting)
            print(f"Baud rate MATCH! {b} -> Response: {resp.hex()}", flush=True)
            found = True
            ser.close()
            break
        ser.close()
    except Exception as e:
        print(f"Error {b}: {e}")

if not found:
    print("No response on any baud rate. Physical connection between CH340 and Scanner Engine is open.", flush=True)
"""
    stdin, stdout, stderr = ssh.exec_command("cat << 'EOF' > /home/ritadmin/test_all_bauds.py\n" + script + "\nEOF\npython3 /home/ritadmin/test_all_bauds.py")
    out = stdout.read().decode('utf-8', errors='replace')
    print(out)
    ssh.close()
except Exception as e:
    print(f"Error: {e}")
