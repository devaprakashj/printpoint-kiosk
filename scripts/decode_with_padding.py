import cv2
import numpy as np

for path in ['scripts/p4_img0.png', 'scripts/p5_img0.png', 'scripts/p5_img1.png', 'scripts/p5_img2.png', 'scripts/p5_img3.png']:
    im = cv2.imread(path)
    # Add white border
    im_padded = cv2.copyMakeBorder(im, 20, 20, 20, 20, cv2.BORDER_CONSTANT, value=[255, 255, 255])
    # Resize 2x
    im_large = cv2.resize(im_padded, (0, 0), fx=3, fy=3, interpolation=cv2.INTER_NEAREST)
    
    detector = cv2.QRCodeDetector()
    val, pts, _ = detector.detectAndDecode(im_large)
    if not val:
        # try grayscale threshold
        gray = cv2.cvtColor(im_large, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
        val, pts, _ = detector.detectAndDecode(thresh)
    print(f"{path}: QR = '{val}'")
