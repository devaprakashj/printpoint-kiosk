"""
Quick script to install img2pdf + pillow on Raspberry Pi 5
where pip3 is not in PATH but python3 -m pip works.
Also installs ImageMagick via apt.
"""
import paramiko
import sys
import time

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

PI_IP = "172.15.28.232"
PI_USER = "ritadmin"
PI_PASS = "adminadmin"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(PI_IP, username=PI_USER, password=PI_PASS, timeout=10)
print("✅ SSH Connected!")

def run(cmd, label="", timeout=90):
    print(f"\n>>> {label or cmd[:60]}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    if out: print(out)
    if err:
        for line in err.splitlines():
            if line.strip() and "sudo" not in line:
                print("  ERR:", line)
    return out

# Try all possible pip invocations
print("\n=== Installing img2pdf + Pillow ===")
result = run(
    "python3 -m pip install --break-system-packages img2pdf pillow 2>&1 | tail -8",
    "python3 -m pip install img2pdf pillow"
)

if "Successfully installed" in result or "already satisfied" in result:
    print("\n✅ pip install succeeded!")
else:
    print("\nTrying apt install...")
    run(
        f"echo '{PI_PASS}' | sudo -S apt-get install -y python3-pil python3-img2pdf 2>&1 | tail -10",
        "apt-get install python3-pil python3-img2pdf",
        timeout=120
    )

# Also try ImageMagick
print("\n=== Installing ImageMagick (optional fallback) ===")
run(
    f"echo '{PI_PASS}' | sudo -S apt-get install -y imagemagick 2>&1 | tail -5",
    "apt-get install imagemagick",
    timeout=120
)

# Verify
print("\n=== Verifying imports ===")
run("python3 -c \"import img2pdf; print('img2pdf:', img2pdf.__version__)\" 2>&1")
run("python3 -c \"from PIL import Image; print('Pillow:', Image.__version__)\" 2>&1")
run("convert --version 2>&1 | head -2 || echo 'ImageMagick not available'")

# Restart daemon to pick up new deps
print("\n=== Restarting SmartPrint daemon ===")
run(f"echo '{PI_PASS}' | sudo -S systemctl restart smartprint.service && sleep 2 && systemctl status smartprint.service --no-pager | head -15")

print("\n✅ All done!")
ssh.close()
