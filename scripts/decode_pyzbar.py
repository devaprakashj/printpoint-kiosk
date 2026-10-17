import cv2
from pyzbar.pyzbar import decode
from PIL import Image

for i in range(4):
    path = f'scripts/page5_img_{i}.png'
    im = Image.open(path)
    decoded = decode(im)
    print(f"Img {i}: pyzbar decoded = {[d.data.decode('utf-8', errors='ignore') for d in decoded]}")
