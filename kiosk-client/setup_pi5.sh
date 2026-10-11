#!/usr/bin/env bash
# ==============================================================================
# SmartPrint Raspberry Pi 5 Auto-Setup & Kiosk Installation Script
# ==============================================================================
set -e

echo "=== [1/4] Updating Apt & Installing CUPS Laser Spooler ==="
sudo apt-get update
sudo apt-get install -y cups python3 python3-pip printer-driver-hpcups

echo "=== [2/4] Enabling CUPS Daemon ==="
sudo systemctl enable cups
sudo systemctl start cups
sudo usermod -a -G lpadmin $USER

echo "=== [3/4] Installing Systemd SmartPrint Background Service ==="
cat << 'EOF' | sudo tee /etc/systemd/system/smartprint-kiosk.service
[Unit]
Description=SmartPrint ATM Kiosk Hardware Daemon
After=network-online.target cups.service
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/printpoint-kiosk/kiosk-client
ExecStart=/usr/bin/python3 smartprint_daemon.py --machine RIT-ATM-01 --server http://localhost:3000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable smartprint-kiosk.service
sudo systemctl start smartprint-kiosk.service

echo "=== [4/4] Installation Complete! SmartPrint Daemon is now running 24/7 ==="
sudo systemctl status smartprint-kiosk.service --no-pager
