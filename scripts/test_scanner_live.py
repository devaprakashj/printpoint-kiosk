import sys
import paramiko

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

# Check if cage or another process is holding an exclusive grab on event5!
check_fuser = """
lsof /dev/input/event5 2>/dev/null || fuser /dev/input/event5 2>/dev/null
"""
stdin, stdout, stderr = client.exec_command(check_fuser)
print("Processes holding /dev/input/event5:")
print(stdout.read().decode('utf-8', errors='replace'))
print("STDERR:", stderr.read().decode('utf-8', errors='replace'))

client.close()
