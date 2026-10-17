import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

cmds = [
    # Walk all input table descriptions and levels
    "snmpwalk -v 2c -c public 172.15.2.212 1.3.6.1.2.1.43.8.2.1.13", # Description / Name
    "snmpwalk -v 2c -c public 172.15.2.212 1.3.6.1.2.1.43.8.2.1.9",  # Max Capacity
    "snmpwalk -v 2c -c public 172.15.2.212 1.3.6.1.2.1.43.8.2.1.10", # Current Level
    "snmpwalk -v 2c -c public 172.15.2.212 1.3.6.1.2.1.43.8.2.1.11", # Unit
    # Check all Kyocera status descriptions
    "snmpwalk -v 2c -c public 172.15.2.212 1.3.6.1.2.1.43.16.5.1.2", # Console Display buffer
    "snmpwalk -v 2c -c public 172.15.2.212 1.3.6.1.2.1.25.3.2.1.3",  # hrDeviceDescr
    "snmpwalk -v 2c -c public 172.15.2.212 1.3.6.1.2.1.25.3.5.1.1",  # hrPrinterStatus
    "snmpwalk -v 2c -c public 172.15.2.212 1.3.6.1.2.1.25.3.5.1.2",  # hrPrinterDetectedErrorState
]

for cmd in cmds:
    print(f"=== {cmd} ===")
    stdin, stdout, stderr = client.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
