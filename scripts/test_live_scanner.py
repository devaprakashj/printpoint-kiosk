import paramiko
import time

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

cmd = """python3 -c "
import struct, os, select, sys

dev = '/dev/input/by-id/usb-WCH.CN_8__Serial_To_HID_12345678-if01-event-kbd'
print('OPENING DEV:', dev)
try:
    f = open(dev, 'rb')
    print('SUCCESS OPENING! Waiting 10 seconds for any keystroke/scan events...')
    r, w, x = select.select([f], [], [], 10)
    if r:
        data = f.read(24)
        print('EVENT RECEIVED! Data len:', len(data))
    else:
        print('NO EVENT in 10s timeout.')
except Exception as e:
    print('ERROR:', e)
"
"""
stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode())
print(stderr.read().decode())
