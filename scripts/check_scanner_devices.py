import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

cmds = [
    'grep -i "HARDWARE SCANNER" /home/ritadmin/printpoint-kiosk/daemon.log | tail -n 20',
    'grep -i "LOCAL WS BRIDGE" /home/ritadmin/printpoint-kiosk/daemon.log | tail -n 20',
    'python3 /home/ritadmin/printpoint-kiosk/inspect_inputs.py',
    'cat /proc/bus/input/devices'
]

for cmd in cmds:
    print(f"=== {cmd} ===")
    stdin, stdout, stderr = client.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
