import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('172.15.28.232', username='ritadmin', password='adminadmin')

cmds = [
    "cat /sys/bus/usb/devices/1-1/power/control",
    "cat /sys/bus/usb/devices/1-1/power/runtime_status 2>/dev/null",
    "echo 0 | sudo tee /sys/bus/usb/devices/1-1/authorized",
    "ls -l /dev/input/by-id/*Serial_To_HID* 2>/dev/null || echo DISCONNECTED",
    "echo 1 | sudo tee /sys/bus/usb/devices/1-1/authorized",
    "sleep 1",
    "ls -l /dev/input/by-id/*Serial_To_HID* 2>/dev/null"
]

for cmd in cmds:
    print(">>>", cmd)
    stdin, stdout, stderr = ssh.exec_command(f"echo adminadmin | sudo -S bash -c '{cmd}'")
    print(stdout.read().decode('utf-8').strip())

ssh.close()
