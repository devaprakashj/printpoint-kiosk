import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)

new_script = '''#!/bin/bash
export XDG_RUNTIME_DIR="/run/user/$(id -u)"
export LIBSEAT_BACKEND=seatd
export WLR_LIBINPUT_NO_DEVICES=1
unset WAYLAND_DISPLAY

CHROMIUM_USER_DIR="/home/ritadmin/.config/chromium-kiosk"
mkdir -p "$CHROMIUM_USER_DIR"

# Wait for local hardware daemon to be listening on port 8765
for i in $(seq 1 15); do
  if ss -tulpn | grep -q 8765; then
    break
  fi
  sleep 1
done

exec /usr/bin/cage -d -s -- /usr/bin/chromium \\
  --kiosk \\
  --ozone-platform=wayland \\
  --remote-debugging-port=9222 \\
  --remote-allow-origins=* \\
  --allow-running-insecure-content \\
  --disable-web-security \\
  --enable-features=OverlayScrollbar \\
  --no-first-run \\
  --noerrdialogs \\
  --disable-infobars \\
  --disable-translate \\
  --disable-features=TranslateUI \\
  --disable-pinch \\
  --disable-suggestions-ui \\
  --user-data-dir="$CHROMIUM_USER_DIR" \\
  --check-for-update-interval=31536000 \\
  --unsafely-treat-insecure-origin-as-secure=http://127.0.0.1:8765,ws://127.0.0.1:8765 \\
  "https://printpoint-kiosk.vercel.app/kiosk/RIT-ATM-01"
'''

sftp = client.open_sftp()
with sftp.file('/home/ritadmin/printpoint-kiosk/launch_kiosk.sh', 'w') as f:
    f.write(new_script)
sftp.chmod('/home/ritadmin/printpoint-kiosk/launch_kiosk.sh', 0o755)
sftp.close()

print('Updated launch_kiosk.sh! Restarting smartprint-kiosk.service...')
stdin, stdout, stderr = client.exec_command('echo adminadmin | sudo -S systemctl restart smartprint-kiosk.service')
print(stdout.read().decode())
print(stderr.read().decode())

client.close()
