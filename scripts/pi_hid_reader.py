import struct
import time
import os
import glob
import sys

# Find the Serial To HID input device automatically
devs = glob.glob('/dev/input/by-id/*Serial_To_HID*')
if not devs:
    devs = glob.glob('/dev/input/event*')
dev_path = devs[0]
print(f"Opening input device: {dev_path}", flush=True)

KEY_MAP = {
    2: '1', 3: '2', 4: '3', 5: '4', 6: '5', 7: '6', 8: '7', 9: '8', 10: '9', 11: '0',
    28: '\n', 57: ' ',
    16: 'q', 17: 'w', 18: 'e', 19: 'r', 20: 't', 21: 'y', 22: 'u', 23: 'i', 24: 'o', 25: 'p',
    30: 'a', 31: 's', 32: 'd', 33: 'f', 34: 'g', 35: 'h', 36: 'j', 37: 'k', 38: 'l',
    44: 'z', 45: 'x', 46: 'c', 47: 'v', 48: 'b', 49: 'n', 50: 'm',
    52: '.', 53: '/', 12: '-', 13: '=', 26: '[', 27: ']', 39: ';', 40: "'", 43: '\\',
    51: ',', 14: '[BKSP]'
}

SHIFT_KEY_MAP = {
    2: '!', 3: '@', 4: '#', 5: '$', 6: '%', 7: '^', 8: '&', 9: '*', 10: '(', 11: ')',
    12: '_', 13: '+', 26: '{', 27: '}', 39: ':', 40: '"', 51: '<', 52: '>', 53: '?'
}

try:
    with open(dev_path, 'rb') as f:
        print("READY! Scanning monitor running in background. Any scan will be captured.", flush=True)
        is_shift = False
        chars = []
        while True:
            data = f.read(24)
            if not data or len(data) < 24:
                continue
            sec, usec, ev_type, ev_code, ev_val = struct.unpack('qqHHi', data)
            if ev_type == 1: # EV_KEY
                if ev_code in (42, 54): # Left/Right Shift
                    is_shift = (ev_val != 0)
                elif ev_val == 1: # Key Down
                    if is_shift and ev_code in SHIFT_KEY_MAP:
                        c = SHIFT_KEY_MAP[ev_code]
                    elif is_shift and ev_code in KEY_MAP:
                        c = KEY_MAP[ev_code].upper()
                    else:
                        c = KEY_MAP.get(ev_code, '')
                    
                    if c == '\n':
                        full_str = "".join(chars).strip()
                        print(f"[{time.strftime('%H:%M:%S')}] SCANNED TEXT: {full_str}", flush=True)
                        with open('/home/ritadmin/scanned_barcode.txt', 'a') as out:
                            out.write(f"[{time.strftime('%H:%M:%S')}] {full_str}\n")
                        chars = []
                    elif c:
                        chars.append(c)
except Exception as e:
    print(f"Reader error: {e}", flush=True)
