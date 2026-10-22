import urllib.request, re

with urllib.request.urlopen('https://printpoint-kiosk.vercel.app/kiosk/RIT-ATM-01') as res:
    html = res.read().decode('utf-8')

print('HTML length:', len(html))
chunks = re.findall(r'src="(/_next/static/chunks/[^"]+\.js)"', html)
print(f'Total chunks found: {len(chunks)}')
for chunk in chunks:
    chunk_url = 'https://printpoint-kiosk.vercel.app' + chunk
    try:
        with urllib.request.urlopen(chunk_url) as cres:
            js = cres.read().decode('utf-8')
        if '8765' in js:
            print(f'>>> FOUND 8765 in {chunk}!')
            idx = js.find('8765')
            print('Snippet:', js[max(0, idx-100):min(len(js), idx+100)])
    except Exception as e:
        print(f'Error fetching {chunk}: {e}')
