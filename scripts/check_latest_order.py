import urllib.request, json

req = urllib.request.Request('https://printpoint-kiosk.vercel.app/api/admin?action=get_orders', headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        orders = data.get('orders', [])
        print(f'Total orders: {len(orders)}')
        for o in orders[:5]:
            print(f"ID: {o.get('id')} | Num: {o.get('orderNumber') or o.get('order_number')} | PIN: {o.get('fourDigitPin') or o.get('four_digit_pin')} | Status: {o.get('orderStatus') or o.get('order_status')} | Paid: {o.get('paymentStatus') or o.get('payment_status')} | Created: {o.get('createdAt') or o.get('created_at')}")
except Exception as e:
    print('Error:', e)
