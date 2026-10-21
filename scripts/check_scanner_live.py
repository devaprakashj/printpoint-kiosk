import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

cmd = """python3 -c "
import glob, os, stat
devs = glob.glob('/dev/input/by-id/*')
print('DEVS BY ID:', devs)
for d in devs:
    print(d, '->', os.path.realpath(d), 'readable:', os.access(d, os.R_OK))
"
"""
stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode())
print('STDERR:', stderr.read().decode())

cmd2 = "ls -l /dev/input/"
stdin, stdout, stderr = client.exec_command(cmd2)
print('INPUT DIR:')
print(stdout.read().decode())
