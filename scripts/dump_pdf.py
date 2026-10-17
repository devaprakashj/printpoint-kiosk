import pypdf

reader = pypdf.PdfReader('scripts/scannerv3_spec.pdf')
with open('scripts/pdf_dump.txt', 'w', encoding='utf-8') as f:
    for i, page in enumerate(reader.pages):
        f.write(f"--- PAGE {i+1} ---\n")
        f.write(page.extract_text() or '')
        f.write("\n\n")

print(f"Dumped {len(reader.pages)} pages to scripts/pdf_dump.txt")
