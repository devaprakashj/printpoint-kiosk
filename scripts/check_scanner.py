import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)
    print("SSH Connected successfully!")
    
    stdin, stdout, stderr = ssh.exec_command('lsusb')
    print("\n=== LSUSB OUTPUT ===")
    print(stdout.read().decode('utf-8', errors='replace').strip())
    
    stdin, stdout, stderr = ssh.exec_command('dmesg | tail -30')
    print("\n=== RECENT KERNEL LOGS (DMESG) ===")
    print(stdout.read().decode('utf-8', errors='replace').strip())
    
    stdin, stdout, stderr = ssh.exec_command('echo adminadmin | sudo -S lsusb -t')
    print("\n=== USB TREE (lsusb -t) ===")
    print(stdout.read().decode('utf-8', errors='replace').strip())

    stdin, stdout, stderr = ssh.exec_command('cat /sys/kernel/debug/usb/devices 2>/dev/null')
    print("\n=== KERNEL USB DEVICES ===")
    print(stdout.read().decode('utf-8', errors='replace').strip())
    
    ssh.close()
except Exception as e:
    print(f"Error: {e}")
