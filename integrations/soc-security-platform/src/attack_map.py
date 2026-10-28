import folium
import geoip2.database
import json
import os


def generate_attack_map():

    db_path = "GeoLite2-City.mmdb"
    alerts_file = "data/alerts.json"

    if not os.path.exists(alerts_file):
        print("No alerts found.")
        return

    reader = geoip2.database.Reader(db_path)

    attack_map = folium.Map(location=[20, 0], zoom_start=2)

    with open(alerts_file) as f:

        for line in f:

            try:
                alert = json.loads(line)
                ip = alert["ip"]

                response = reader.city(ip)

                lat = response.location.latitude
                lon = response.location.longitude
                country = response.country.name

                folium.Marker(
                    location=[lat, lon],
                    popup=f"{ip} ({country})"
                ).add_to(attack_map)

            except:
                pass

    attack_map.save("dashboard/attack_map.html")

    print("Attack map generated.")