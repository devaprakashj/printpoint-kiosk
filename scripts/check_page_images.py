import pypdf

reader = pypdf.PdfReader('scripts/scannerv3_spec.pdf')
for p_idx in [3, 4, 13, 14, 15, 32, 33, 36, 39]:
    page = reader.pages[p_idx]
    print(f"Page {p_idx+1} images count: {len(page.images)}")
