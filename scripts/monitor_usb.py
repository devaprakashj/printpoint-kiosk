import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)
    print("Monitoring Pi USB ports for 20 seconds...")
    for i in range(20):
        _, stdout, _ = ssh.exec_command('lsusb')
        out = stdout.read().decode('utf-8', errors='replace').strip()
        lines = [l for l in out.splitlines() if 'root hub' not in l]
        if lines:
            print(f"\n✅ DEVICE DETECTED at sec {i+1}!")
            print("\n".join(lines))
            _, dmesg_out, _ = ssh.exec_command('dmesg | tail -15')
            print("\n--- DMESG ---")
            print(dmesg_out.read().decode('utf-8', errors='replace').strip())
            break
        time.sleep(1)
    else:
        print("No new device detected during 20s window.")
    ssh.close()
except Exception as e:
    print(f"SSH Error: {e}")
