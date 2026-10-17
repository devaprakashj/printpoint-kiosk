import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

cmds = [
    'cat ~/.config/wayfire.ini 2>/dev/null',
    'cat ~/.config/lxsession/LXDE-pi/autostart 2>/dev/null',
    'cat /etc/xdg/lxsession/LXDE-pi/autostart 2>/dev/null',
    'cat /home/ritadmin/printpoint-kiosk/daemon.log 2>/dev/null | tail -n 25'
]

for cmd in cmds:
    print(f"=== {cmd} ===")
    stdin, stdout, stderr = client.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
