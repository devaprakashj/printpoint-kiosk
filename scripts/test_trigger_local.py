import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

    script = """
import serial
import time

for baud in [9600, 115200]:
    print(f"\\n--- Testing Baud Rate: {baud} ---", flush=True)
    try:
        ser = serial.Serial('/dev/ttyUSB0', baud, timeout=0.5)
        
        # Test 1: Send trigger command
        trigger_cmd = bytes.fromhex('7E 00 08 01 00 02 01 AB CD')
        print(f"Sending trigger command: {trigger_cmd.hex()}", flush=True)
        ser.write(trigger_cmd)
        time.sleep(0.3)
        if ser.in_waiting > 0:
            resp = ser.read(ser.in_waiting)
            print(f"Response from scanner ({baud}): {resp.hex()} (ASCII: {resp})", flush=True)
        else:
            print("No response to trigger command.", flush=True)
        ser.close()
    except Exception as e:
        print(f"Error on {baud}: {e}", flush=True)
"""
    stdin, stdout, stderr = ssh.exec_command("cat << 'EOF' > /home/ritadmin/test_trigger.py\n" + script + "\nEOF\npython3 /home/ritadmin/test_trigger.py")
    out = stdout.read().decode('utf-8', errors='replace')
    print(out)
    ssh.close()
except Exception as e:
    print(f"Error: {e}")
