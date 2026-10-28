import json

def generate_alert(ip,attack,mitre):

    alert = {

        "ip":ip,
        "attack":attack,
        "mitre":mitre

    }

    with open("data/alerts.json","a") as f:

        f.write(json.dumps(alert)+"\n")

    print("SOC ALERT:",alert)