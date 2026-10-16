import paramiko
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("172.15.28.232", username="ritadmin", password="adminadmin")

# Create a test 2-page PDF on the Pi using ImageMagick / python
cmd = """python3 -c "
from PIL import Image, ImageDraw, ImageFont
import os

im1 = Image.new('RGB', (1240, 1754), color='white')
d1 = ImageDraw.Draw(im1)
d1.text((100, 200), 'PAGE 1 - FRONT SIDE (SmartPrint Test)', fill='black')

im2 = Image.new('RGB', (1240, 1754), color='white')
d2 = ImageDraw.Draw(im2)
d2.text((100, 200), 'PAGE 2 - BACK SIDE (SmartPrint Test)', fill='black')

im1.save('/tmp/test_2page.pdf', save_all=True, append_images=[im2])
print('Created /tmp/test_2page.pdf')
"
pdfinfo /tmp/test_2page.pdf
"""
_, out, err = ssh.exec_command(cmd)
print("OUT:", out.read().decode("utf-8", errors="replace"))
print("ERR:", err.read().decode("utf-8", errors="replace"))

