import subprocess
import re

def query_kyocera(ip="172.15.2.212"):
    try:
        # Query Printer State string
        state_out = subprocess.check_output(
            f"snmpget -v 2c -c public -Oqv {ip} 1.3.6.1.2.1.43.16.5.1.2.1.1 2>/dev/null",
            shell=True, text=True, timeout=2
        ).strip().strip('"')
    except Exception as e:
        state_out = "Offline"

    try:
        # Query Model
        model_out = subprocess.check_output(
            f"snmpget -v 2c -c public -Oqv {ip} 1.3.6.1.4.1.1347.43.5.1.1.1.1 2>/dev/null",
            shell=True, text=True, timeout=2
        ).strip().strip('"')
    except Exception:
        model_out = "Kyocera"

    try:
        # Query Alerts
        alert_out = subprocess.check_output(
            f"snmpwalk -v 2c -c public -Oqv {ip} 1.3.6.1.2.1.43.18.1.1.7 2>/dev/null",
            shell=True, text=True, timeout=2
        ).strip()
        alert_codes = [int(x) for x in re.findall(r'\d+', alert_out)]
    except Exception:
        alert_codes = []

    # Map alerts:
    # 8 or 808: inputMediaSupplyLow (Paper Low in Cassette)
    # 5 or 503: coverOpen
    # 10 or 1001: markerSupplyEmpty / Toner Low
    # 4 or 401: paperJam
    is_paper_low = any(c in (8, 808, 1108) for c in alert_codes)
    is_paper_empty = any(c in (5, 502, 1105) for c in alert_codes)
    is_cover_open = any(c in (503, 3) for c in alert_codes)
    is_jam = any(c in (4, 401, 801) for c in alert_codes)

    return {
        "ip": ip,
        "model": model_out,
        "state": state_out,
        "is_paper_low": is_paper_low,
        "is_paper_empty": is_paper_empty,
        "is_cover_open": is_cover_open,
        "is_jam": is_jam,
        "alert_codes": alert_codes
    }

print("Live Kyocera Query Result:")
print(query_kyocera())
