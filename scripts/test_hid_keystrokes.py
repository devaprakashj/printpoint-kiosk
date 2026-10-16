import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

    script = """import struct
import time
import sys

# Linux input_event struct: time (8s + 8us = 16 bytes on 64-bit), type (2 bytes), code (2 bytes), value (4 bytes) = 24 bytes
EVENT_DEV = '/dev/input/event5'
KEY_MAP = {
    2: '1', 3: '2', 4: '3', 5: '4', 6: '5', 7: '6', 8: '7', 9: '8', 10: '9', 11: '0',
    28: '\\n', 57: ' ',
    16: 'q', 17: 'w', 18: 'e', 19: 'r', 20: 't', 21: 'y', 22: 'u', 23: 'i', 24: 'o', 25: 'p',
    30: 'a', 31: 's', 32: 'd', 33: 'f', 34: 'g', 35: 'h', 36: 'j', 37: 'k', 38: 'l',
    44: 'z', 45: 'x', 46: 'c', 47: 'v', 48: 'b', 49: 'n', 50: 'm',
    52: '.', 53: '/', 12: '-', 13: '='
}

print(f"Opening {EVENT_DEV} (USB KEYBOARD SCANNER)...", flush=True)
print(">>> READY! SCAN ANY BARCODE OR QR CODE NOW (30 SECONDS) <<<", flush=True)

try:
    with open(EVENT_DEV, 'rb') as f:
        start = time.time()
        scanned_keys = []
        while time.time() - start < 30:
            data = f.read(24)
            if not data or len(data) < 24:
                continue
            sec, usec, ev_type, ev_code, ev_val = struct.unpack('qqHHi', data)
            # ev_type == 1 is EV_KEY, ev_val == 1 is key press
            if ev_type == 1 and ev_val == 1:
                ch = KEY_MAP.get(ev_code, f'[{ev_code}]')
                scanned_keys.append(ch)
                if ch == '\\n':
                    result = "".join(scanned_keys).strip()
                    print(f"\\n🎉🎉🎉 SUCCESS! SCANNED KEYBOARD TEXT: {result}", flush=True)
                    sys.exit(0)
    print("Timeout: No key event received.")
except Exception as e:
    print(f"Error: {e}")
"""
    stdin, stdout, stderr = ssh.exec_command("echo adminadmin | sudo -S chmod 666 /dev/input/event5")
    stdout.read()
    
    stdin, stdout, stderr = ssh.exec_command("cat << 'EOF' > /home/ritadmin/test_hid_scan.py\n" + script + "\nEOF")
    stdout.read()
    print("Test script ready.")
    ssh.close()
except Exception as e:
    print(f"Error: {e}")
