import os
import qrcode
from PIL import Image
import paramiko
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as ReportLabImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm

def generate_pdf(output_path="calibration_sheet.pdf"):
    temp_dir = "temp_qrs"
    os.makedirs(temp_dir, exist_ok=True)
    
    qrs_data = {
        "unlock": ("~M00910001.", "STEP 1: Unlock Setting Mode", "முதலில் இதை ஸ்கேன் செய்யவும் (1 Beep)"),
        "induction": ("~M00210002.", "STEP 2: Auto-Sensing / Induction", "பட்டன் அழுத்தாமல் தானாக ஸ்கேன் செய்ய"),
        "night_off": ("~M00260000.", "STEP 3: Turn OFF White LED", "வெள்ளை LED-ஐ அணைக்க"),
        "save": ("~MA5F0506A.", "STEP 4: Save to Memory", "செட்டிங்ஸை மெமரியில் சேவ் செய்ய"),
        "lock": ("~M00910000.", "STEP 5: Lock & Exit Config", "செட்டிங் மோடை முடிக்க"),
        "order": (
            '{"type":"SMARTPRINT_ORDER","orderId":"89002f4b-7208-4711-9a9c-30446f32f2a4","orderNumber":"ORD-20261017-8087","pin":"9287","machineCode":"RIT-ATM-01"}',
            "STEP 6: LIVE ORDER TEST PASS (PIN: 9287)",
            "இதை ஸ்கேன் செய்தால் உடனே Kiosk ஸ்கிரீனில் ஆர்டர் வந்து பிரிண்ட் ஆகும்!"
        )
    }
    
    img_paths = {}
    for key, (code_text, _, _) in qrs_data.items():
        qr = qrcode.QRCode(version=1, box_size=10, border=2)
        qr.add_data(code_text)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        p = os.path.join(temp_dir, f"{key}.png")
        img.save(p)
        img_paths[key] = p

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
        topMargin=12 * mm,
        bottomMargin=12 * mm
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        alignment=1
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569'),
        alignment=1
    )
    card_title_style = ParagraphStyle(
        'CardTitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=13,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#0f172a'),
        alignment=1
    )
    card_desc_style = ParagraphStyle(
        'CardDesc',
        parent=styles['Normal'],
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#334155'),
        alignment=1
    )
    order_title_style = ParagraphStyle(
        'OrderTitle',
        parent=styles['Normal'],
        fontSize=13,
        leading=16,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#1e3a8a'),
        alignment=1
    )
    order_desc_style = ParagraphStyle(
        'OrderDesc',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#1e40af'),
        alignment=1
    )

    story = []
    
    story.append(Paragraph("SmartPrint ATM Kiosk &bull; Hardware Calibration Sheet", title_style))
    story.append(Paragraph("Rajalakshmi Institute of Technology &bull; MH-ET LIVE Scanner v3.0 Setup", subtitle_style))
    story.append(Spacer(1, 4 * mm))

    # Grid 1: Setup Steps 1 to 4 (2x2 table)
    # Cell 1: Step 1 Unlock
    c1 = [
        ReportLabImage(img_paths["unlock"], width=28*mm, height=28*mm),
        Paragraph(qrs_data["unlock"][1], card_title_style),
        Paragraph(qrs_data["unlock"][2], card_desc_style)
    ]
    # Cell 2: Step 2 Induction
    c2 = [
        ReportLabImage(img_paths["induction"], width=28*mm, height=28*mm),
        Paragraph(qrs_data["induction"][1], card_title_style),
        Paragraph(qrs_data["induction"][2], card_desc_style)
    ]
    # Cell 3: Step 3 Turn off Night LED
    c3 = [
        ReportLabImage(img_paths["night_off"], width=28*mm, height=28*mm),
        Paragraph(qrs_data["night_off"][1], card_title_style),
        Paragraph(qrs_data["night_off"][2], card_desc_style)
    ]
    # Cell 4: Step 4 Save & Lock
    c4 = [
        ReportLabImage(img_paths["save"], width=28*mm, height=28*mm),
        Paragraph(qrs_data["save"][1], card_title_style),
        Paragraph(qrs_data["save"][2], card_desc_style)
    ]

    t1_data = [[c1, c2], [c3, c4]]
    t1 = Table(t1_data, colWidths=[88*mm, 88*mm])
    t1.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOX', (0,0), (0,0), 1, colors.HexColor('#cbd5e1')),
        ('BOX', (1,0), (1,0), 1, colors.HexColor('#cbd5e1')),
        ('BOX', (0,1), (0,1), 1, colors.HexColor('#cbd5e1')),
        ('BOX', (1,1), (1,1), 1, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('TOPPADDING', (0,0), (-1,-1), 3*mm),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3*mm),
    ]))
    story.append(t1)
    story.append(Spacer(1, 4 * mm))

    # Grid 2: Step 5 Lock and Live Order Test Pass (Big Card)
    c_lock = [
        ReportLabImage(img_paths["lock"], width=28*mm, height=28*mm),
        Paragraph(qrs_data["lock"][1], card_title_style),
        Paragraph(qrs_data["lock"][2], card_desc_style)
    ]
    c_order = [
        ReportLabImage(img_paths["order"], width=42*mm, height=42*mm),
        Paragraph(qrs_data["order"][1], order_title_style),
        Paragraph(qrs_data["order"][2], order_desc_style)
    ]

    t2_data = [[c_lock, c_order]]
    t2 = Table(t2_data, colWidths=[65*mm, 111*mm])
    t2.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOX', (0,0), (0,0), 1, colors.HexColor('#cbd5e1')),
        ('BOX', (1,0), (1,0), 2, colors.HexColor('#2563eb')),
        ('BACKGROUND', (0,0), (0,0), colors.HexColor('#f8fafc')),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor('#eff6ff')),
        ('TOPPADDING', (0,0), (-1,-1), 4*mm),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4*mm),
    ]))
    story.append(t2)

    doc.build(story)
    print(f"Generated PDF calibration sheet at: {output_path}")

def print_to_kyocera(pdf_local_path="calibration_sheet.pdf"):
    print("Connecting to Raspberry Pi via SSH...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect('172.15.28.232', username='ritadmin', password='adminadmin', timeout=5)
    
    remote_path = "/home/ritadmin/printpoint-kiosk/calibration_sheet.pdf"
    print(f"Uploading {pdf_local_path} to {remote_path} on Pi...")
    sftp = client.open_sftp()
    sftp.put(pdf_local_path, remote_path)
    sftp.close()
    
    print("Submitting print job to Kyocera 3212i via CUPS...")
    # lp -d Kyocera_3212i -o media=A4 -o fit-to-page
    cmd = "lp -d Kyocera_3212i -o media=A4 -o PageSize=A4 -o fit-to-page /home/ritadmin/printpoint-kiosk/calibration_sheet.pdf"
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    
    print("CUPS Response:", out)
    if err:
        print("CUPS Error:", err)
        
    client.close()
    return out

if __name__ == "__main__":
    generate_pdf()
    print_to_kyocera()
