from collections import defaultdict

attempts = defaultdict(int)

def detect_brute_force(ip,event):

    if event == "FAILED_LOGIN":

        attempts[ip] += 1

        if attempts[ip] > 5:
            return True

    return False