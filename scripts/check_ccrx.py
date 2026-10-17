import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

cmds = [
    'curl -sk https://172.15.2.212/startwlm/Start_Wlm.htm | head -n 40',
    'curl -sk https://172.15.2.212/js/jssrc/model/startwlm/HServer.model.htm 2>/dev/null | head -n 40',
    'curl -sk https://172.15.2.212/js/jssrc/model/startwlm/HServer.js 2>/dev/null | head -n 40'
]

for cmd in cmds:
    print(f"=== {cmd} ===")
    stdin, stdout, stderr = client.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
