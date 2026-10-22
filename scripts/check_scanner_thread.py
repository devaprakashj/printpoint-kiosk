import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

# Check running threads of the python process
stdin, stdout, stderr = client.exec_command("""
python3 -c "
import urllib.request, json
# Let's inspect the process threads
import subprocess
ps = subprocess.check_output(['ps', '-eLo', 'pid,tid,comm,args']).decode()
for line in ps.splitlines():
    if 'smartprint' in line:
        print(line[:120])
"
""")
print(stdout.read().decode())
print(stderr.read().decode())
client.close()
