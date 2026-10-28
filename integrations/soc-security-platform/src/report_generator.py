import json

def generate_report():

    with open("data/alerts.json") as f:

        alerts = f.readlines()

    print("\n--- INCIDENT REPORT ---")

    for a in alerts:

        print(a)