from collections import defaultdict

ports = defaultdict(set)

def detect_port_scan(ip,port):

    ports[ip].add(port)

    if len(ports[ip]) > 10:
        return True

    return False