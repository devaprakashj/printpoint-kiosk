import pypdf
from PIL import Image
import io
import cv2

reader = pypdf.PdfReader('scripts/scannerv3_spec.pdf')
for p_idx in [24, 25, 29, 30]:
    page = reader.pages[p_idx]
    print(f"Page {p_idx+1} has {len(page.images)} images")
    for i, img in enumerate(page.images):
        im = Image.open(io.BytesIO(img.data))
        path = f'scripts/p{p_idx+1}_img{i}.png'
        im.save(path)
        if im.size[1] > 50:
            cv_img = cv2.imread(path)
            im_padded = cv2.copyMakeBorder(cv_img, 20, 20, 20, 20, cv2.BORDER_CONSTANT, value=[255, 255, 255])
            im_large = cv2.resize(im_padded, (0, 0), fx=3, fy=3, interpolation=cv2.INTER_NEAREST)
            detector = cv2.QRCodeDetector()
            val, pts, _ = detector.detectAndDecode(im_large)
            print(f"  Img {i} QR: '{val}'")
