import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)
    
    stdin, stdout, _ = ssh.exec_command('lsusb')
    print("=== LSUSB ===")
    print(stdout.read().decode('utf-8', errors='replace').strip())
    
    stdin, stdout, _ = ssh.exec_command('ls -l /dev/input/by-id/ 2>/dev/null || echo "No /dev/input/by-id/"')
    print("\n=== INPUT DEVICES (/dev/input/by-id/) ===")
    print(stdout.read().decode('utf-8', errors='replace').strip())
    
    stdin, stdout, _ = ssh.exec_command('cat /proc/bus/input/devices | grep -E "Name|Handlers"')
    print("\n=== KERNEL INPUT HANDLERS ===")
    print(stdout.read().decode('utf-8', errors='replace').strip())
    
    ssh.close()
except Exception as e:
    print(f"Error: {e}")
