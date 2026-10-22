import sys
import paramiko

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=10)

launcher = """#!/bin/bash
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

exec /usr/bin/cage -d -s -- /usr/bin/chromium \
  --kiosk \
  --ozone-platform=wayland \
  --enable-features=OverlayScrollbar \
  --no-first-run \
  --noerrdialogs \
  --disable-infobars \
  --disable-translate \
  --disable-features=TranslateUI \
  --disable-pinch \
  --disable-suggestions-ui \
  --user-data-dir="$CHROMIUM_USER_DIR" \
  --check-for-update-interval=31536000 \
  --unsafely-treat-insecure-origin-as-secure=ws://127.0.0.1:8765 \
  "https://printpoint-kiosk.vercel.app/kiosk/RIT-ATM-01"
"""

sftp = client.open_sftp()
with sftp.file('/home/ritadmin/printpoint-kiosk/launch_kiosk.sh', 'w') as f:
    f.write(launcher)
sftp.chmod('/home/ritadmin/printpoint-kiosk/launch_kiosk.sh', 0o755)

service_content = """[Unit]
Description=SmartPrint Autonomous Kiosk Fullscreen Display
After=network-online.target seatd.service smartprint.service
Wants=network-online.target seatd.service smartprint.service

[Service]
Type=simple
User=ritadmin
PAMName=login
Environment=XDG_RUNTIME_DIR=/run/user/1000
Environment=LIBSEAT_BACKEND=seatd
Environment=WLR_LIBINPUT_NO_DEVICES=1
WorkingDirectory=/home/ritadmin/printpoint-kiosk
ExecStart=/home/ritadmin/printpoint-kiosk/launch_kiosk.sh
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
"""

with sftp.file('/tmp/smartprint-kiosk.service', 'w') as f:
    f.write(service_content)
sftp.close()

stdin, stdout, stderr = client.exec_command(
    'echo adminadmin | sudo -S cp /tmp/smartprint-kiosk.service /etc/systemd/system/smartprint-kiosk.service && '
    'echo adminadmin | sudo -S systemctl daemon-reload && '
    'echo adminadmin | sudo -S systemctl enable smartprint-kiosk.service && '
    'echo adminadmin | sudo -S systemctl restart smartprint.service'
)
print("STDOUT:", stdout.read().decode())
print("STDERR:", stderr.read().decode())
client.close()
