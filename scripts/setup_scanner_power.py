import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('172.15.28.232', username='ritadmin', password='adminadmin')

uhubctl_path = "/usr/sbin/uhubctl"
print('uhubctl path:', uhubctl_path)

rule = f"ritadmin ALL=(ALL) NOPASSWD: {uhubctl_path}\n"
cmd = f"echo '{rule}' | sudo tee /etc/sudoers.d/010_uhubctl && sudo chmod 0440 /etc/sudoers.d/010_uhubctl"
stdin, stdout, stderr = ssh.exec_command(f"echo adminadmin | sudo -S bash -c \"{cmd}\"")
stdout.read()
print('Sudoers configured!')

# Test passwordless
stdin, stdout, stderr = ssh.exec_command(f"sudo {uhubctl_path} -l 1 -p 1")
print("Passwordless uhubctl test:")
print(stdout.read().decode('utf-8').strip())

ssh.close()
