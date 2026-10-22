import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

cmd = '''python3 -c "
import asyncio, websockets

async def test():
    try:
        async with websockets.connect('ws://127.0.0.1:8765') as ws:
            print('CONNECTED OK TO 8765!')
            await ws.send('{\\"type\\":\\"PING\\"}')
            print('SENT PING!')
    except Exception as e:
        print('CONNECT FAILED:', e)

asyncio.run(test())
"'''
stdin, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode())
print(stderr.read().decode())

client.close()
