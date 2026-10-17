import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

cmds = [
    # Kyocera Supplies / Toner
    'snmpwalk -v 2c -c public 172.15.2.212 1.3.6.1.2.1.43.11.1.1 2>/dev/null',
    # Kyocera Private MIB for Paper Trays / Status
    'snmpwalk -v 2c -c public 172.15.2.212 1.3.6.1.4.1.1347.43 2>/dev/null | head -n 30',
    # Printer Cover / Status
    'snmpwalk -v 2c -c public 172.15.2.212 1.3.6.1.2.1.43.16.5.1 2>/dev/null | head -n 20'
]

for cmd in cmds:
    print(f"=== {cmd} ===")
    stdin, stdout, stderr = client.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
