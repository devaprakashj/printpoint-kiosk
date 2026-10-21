import os
from pyzbar.pyzbar import decode
from PIL import Image

folder = 'scripts/barcodes'
for f in os.listdir(folder):
    if f.endswith(('.png', '.jpg')):
        p = os.path.join(folder, f)
        try:
            im = Image.open(p)
            res = decode(im)
            if res:
                print(f, '->', [r.data.decode('utf-8', errors='ignore') for r in res])
            else:
                # print(f, 'no barcode found')
                pass
        except Exception as e:
            pass
