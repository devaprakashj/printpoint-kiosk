with open('scripts/pdf_dump.txt', encoding='utf-8') as f:
    pages = f.read().split('--- PAGE ')

for p in pages:
    if not p.strip(): continue
    page_num = p.split(' ---')[0]
    content = p.split(' ---')[1]
    
    # check interesting keywords
    for kw in ['Aiming light', 'Fill light', 'Continuous mode', 'Induction mode', 'Trigger mode', 'Command trigger', 'All 1D code', 'Reset']:
        if kw.lower() in content.lower():
            print(f"=== PAGE {page_num} (matched {kw}) ===")
            for line in content.splitlines()[:20]:
                print("  ", line)
            print("...")
            break
