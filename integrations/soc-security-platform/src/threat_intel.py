def load_blacklist():

    with open("config/suspicious_ips.txt") as f:

        return f.read().splitlines()

def check_ip(ip,blacklist):

    return ip in blacklist