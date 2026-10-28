def map_attack(attack):

    mitre = {

        "brute_force":"T1110",
        "port_scan":"T1046"

    }

    return mitre.get(attack,"Unknown")