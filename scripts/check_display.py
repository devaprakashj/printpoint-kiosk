import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
try:
    ssh.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)
    
    stdin, stdout, _ = ssh.exec_command('who')
    print("WHO:")
    print(stdout.read().decode('utf-8').strip())

    stdin, stdout, _ = ssh.exec_command('ps aux | grep -iE "xorg|wayland|labwc|wayfire|chromium|firefox"')
    print("\nGUI / BROWSER PROCESSES:")
    print(stdout.read().decode('utf-8').strip())

    stdin, stdout, _ = ssh.exec_command('ls -l /sys/class/drm/card*')
    print("\nDRM DISPLAYS:")
    print(stdout.read().decode('utf-8').strip())

    ssh.close()
except Exception as e:
    print(f"Error: {e}")
