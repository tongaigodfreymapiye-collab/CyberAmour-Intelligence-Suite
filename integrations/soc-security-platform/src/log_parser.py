import re

def parse_log(line):

    ip_match = re.search(r'(\d+\.\d+\.\d+\.\d+)', line)

    ip = ip_match.group(1) if ip_match else None

    if "Failed password" in line:
        event = "FAILED_LOGIN"
    elif "Accepted password" in line:
        event = "SUCCESS_LOGIN"
    else:
        event = "OTHER"

    return {"ip":ip,"event":event}