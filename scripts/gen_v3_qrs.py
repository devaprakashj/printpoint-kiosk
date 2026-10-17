import qrcode
import os
import cv2

qr_codes = {
    # Scanner v3.0 Official Commands from E-Gizmo Specification
    'v3_unlock.png': '~M00910001.',
    'v3_white_led_off.png': '~M01030000.',
    'v3_red_laser_off.png': '~M01050000.',
    'v3_disable_1d.png': '~M00010000.',
    'v3_induction_mode.png': '~M00210002.',
    'v3_continuous_mode.png': '~M00210001.',
    'v3_save.png': '~MA5F0506A.',
    'v3_lock.png': '~M00910000.',
    'v3_reset_factory.png': '~MA5F01B2C.',
    
    # Aliases matching current and previous UI references
    'step1_unlock.png': '~M00910001.',
    'step2_white_led_off.png': '~M01030000.',
    'step2_white_led_standard.png': '~M00210002.',
    'step3_red_laser_off.png': '~M01050000.',
    'step3_disable_1d.png': '~M00010000.',
    'step4_save.png': '~MA5F0506A.',
    'step5_lock.png': '~M00910000.'
}

os.makedirs('public', exist_ok=True)

for fname, text in qr_codes.items():
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=15,
        border=4
    )
    qr.add_data(text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    path = os.path.join('public', fname)
    img.save(path)
    
    # Verify with OpenCV
    cv_img = cv2.imread(path)
    detector = cv2.QRCodeDetector()
    decoded_val, _, _ = detector.detectAndDecode(cv_img)
    print(f"Generated {fname}: '{text}' -> Decoded: '{decoded_val}' (OK: {decoded_val == text})")
