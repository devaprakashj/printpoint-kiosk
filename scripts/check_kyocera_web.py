import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

# Test fetch port 80 HTML/API or SNMP
cmds = [
    'curl -s -m 3 http://172.15.2.212/ | head -n 30',
    'curl -s -m 3 http://172.15.2.212/startwlm/HServer.wlm 2>/dev/null | head -n 30',
    'curl -s -m 3 http://172.15.2.212/js/jssrc/model/startwlm/HServer.js 2>/dev/null | head -n 30',
    'python3 -c "import urllib.request; print(urllib.request.urlopen(\'http://172.15.2.212/\', timeout=3).read()[:500])"'
]

for cmd in cmds:
    print(f"=== {cmd} ===")
    stdin, stdout, stderr = client.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='ignore'))

client.close()
