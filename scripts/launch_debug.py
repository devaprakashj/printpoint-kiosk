import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

cmd = """cat << 'EOF' > /home/ritadmin/pi_scan_debug.py
import struct, os, sys, time, glob, re

dev = '/dev/input/by-id/usb-WCH.CN_8__Serial_To_HID_12345678-if01-event-kbd'
print(f"Opening {dev}...", flush=True)

KEY_MAP = {
    2: '1', 3: '2', 4: '3', 5: '4', 6: '5', 7: '6', 8: '7', 9: '8', 10: '9', 11: '0',
    28: '\n', 57: ' ',
    16: 'q', 17: 'w', 18: 'e', 19: 'r', 20: 't', 21: 'y', 22: 'u', 23: 'i', 24: 'o', 25: 'p',
    30: 'a', 31: 's', 32: 'd', 33: 'f', 34: 'g', 35: 'h', 36: 'j', 37: 'k', 38: 'l',
    44: 'z', 45: 'x', 46: 'c', 47: 'v', 48: 'b', 49: 'n', 50: 'm',
    52: '.', 53: '/', 12: '-', 13: '=', 26: '[', 27: ']', 39: ';', 40: "'", 43: '\\\\',
    51: ',', 14: ''
}
SHIFT_KEY_MAP = {
    2: '!', 3: '@', 4: '#', 5: '$', 6: '%', 7: '^', 8: '&', 9: '*', 10: '(', 11: ')',
    12: '_', 13: '+', 26: '{', 27: '}', 39: ':', 40: '"', 51: '<', 52: '>', 53: '?'
}

chars = []
is_shift = False

with open(dev, 'rb') as f:
    print("READY FOR SCAN. Present barcode to scanner now...", flush=True)
    while True:
        data = f.read(24)
        if not data:
            continue
        sec, usec, ev_type, ev_code, ev_val = struct.unpack('qqHHi', data)
        if ev_type == 1:
            if ev_code in (42, 54):
                is_shift = (ev_val != 0)
            elif ev_val == 1:
                if is_shift and ev_code in SHIFT_KEY_MAP:
                    c = SHIFT_KEY_MAP[ev_code]
                elif is_shift and ev_code in KEY_MAP:
                    c = KEY_MAP[ev_code].upper()
                else:
                    c = KEY_MAP.get(ev_code, '')
                
                if c == '\n':
                    scanned = ''.join(chars).strip()
                    chars = []
                    print(f"\\n>>> SCANNED COMPLETE: {scanned}\\n", flush=True)
                elif c:
                    chars.append(c)
                    print(c, end='', flush=True)
EOF
nohup python3 /home/ritadmin/pi_scan_debug.py > /home/ritadmin/scan_debug.log 2>&1 &
echo "DEBUG SCRIPT LAUNCHED! PID: $!"
"""
stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode())
print(stderr.read().decode())
