import pypdf
from PIL import Image
import io
import cv2

reader = pypdf.PdfReader('scripts/scannerv3_spec.pdf')
for p_idx in [3, 4, 13, 14, 15]:
    page = reader.pages[p_idx]
    for i, img in enumerate(page.images):
        im = Image.open(io.BytesIO(img.data))
        path = f'scripts/p{p_idx+1}_img{i}.png'
        im.save(path)
        
        cv_img = cv2.imread(path)
        detector = cv2.QRCodeDetector()
        val, pts, _ = detector.detectAndDecode(cv_img)
        print(f"Page {p_idx+1} Img {i}: size={im.size}, QR='{val}'")
