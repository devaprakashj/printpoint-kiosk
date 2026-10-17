import os
import cv2

for i in range(4):
    path = f'scripts/page5_img_{i}.png'
    if os.path.exists(path):
        img = cv2.imread(path)
        detector = cv2.QRCodeDetector()
        val, pts, qrcode = detector.detectAndDecode(img)
        print(f"Img {i}: QR decoded = '{val}'")
