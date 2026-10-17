import cv2
import glob

for path in sorted(glob.glob('scripts/p1[456]_img*.png')):
    im = cv2.imread(path)
    if im.shape[0] < 50:  # skip the 10px lines
        continue
    im_padded = cv2.copyMakeBorder(im, 20, 20, 20, 20, cv2.BORDER_CONSTANT, value=[255, 255, 255])
    im_large = cv2.resize(im_padded, (0, 0), fx=3, fy=3, interpolation=cv2.INTER_NEAREST)
    detector = cv2.QRCodeDetector()
    val, pts, _ = detector.detectAndDecode(im_large)
    if not val:
        gray = cv2.cvtColor(im_large, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
        val, pts, _ = detector.detectAndDecode(thresh)
    print(f"{path}: QR = '{val}'")
