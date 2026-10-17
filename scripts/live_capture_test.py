import paramiko
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)
    print("Connecting to live scanner listener on Raspberry Pi...")
    stdin, stdout, stderr = ssh.exec_command('python3 /home/ritadmin/pi_hid_reader.py')
    print(stdout.readline().strip())
    print(stdout.readline().strip())
    print("\n>>> SCAN YOUR QR CODE RIGHT NOW (Waiting for scan...) <<<", flush=True)
    # Read the next scanned line
    scanned_line = stdout.readline()
    print("\n" + "="*50)
    print(scanned_line.strip())
    print("="*50)
    ssh.close()
except Exception as e:
    print(f"Error: {e}")
