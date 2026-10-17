import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

cmds = [
    'ping -c 2 172.15.2.212',
    'which snmpget snmpwalk',
    'python3 -c "import socket; s = socket.socket(); s.settimeout(2); print(\'Port 9100:\', s.connect_ex((\'172.15.2.212\', 9100)))"',
    'python3 -c "import socket; s = socket.socket(); s.settimeout(2); print(\'Port 80:\', s.connect_ex((\'172.15.2.212\', 80)))"',
    'python3 -c "import socket; s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.settimeout(2); print(\'SNMP UDP 161:\', s.connect_ex((\'172.15.2.212\', 161)))"'
]

for cmd in cmds:
    print(f"=== {cmd} ===")
    stdin, stdout, stderr = client.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
