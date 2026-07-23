import json

NEW_SEAL = {
    "name": "Digital Vacation AT Seal",
    "priceM": 0,
    "qty": {
        "Unopened": 0, "Normal": 1, "Bronze": 50,
        "Silver": 200, "Gold": 500, "Platinum": 1000, "Master": 3000
    },
    "stats": {
        "AT [Attack Damage]": {"Unopened":0,"Normal":50,"Bronze":100,"Silver":200,"Gold":300,"Platinum":400,"Master":500},
        "CT [Critical Hit Rate]": {"Unopened":0,"Normal":0,"Bronze":0,"Silver":0,"Gold":0,"Platinum":0,"Master":0},
        "HT [Hit Rate]":          {"Unopened":0,"Normal":0,"Bronze":0,"Silver":0,"Gold":0,"Platinum":0,"Master":0},
        "HP [Health Points]":     {"Unopened":0,"Normal":0,"Bronze":0,"Silver":0,"Gold":0,"Platinum":0,"Master":0},
        "DS [Digi-Soul Points]":  {"Unopened":0,"Normal":0,"Bronze":0,"Silver":0,"Gold":0,"Platinum":0,"Master":0},
        "DE [Defense]":           {"Unopened":0,"Normal":0,"Bronze":0,"Silver":0,"Gold":0,"Platinum":0,"Master":0},
        "BL [Block Rate]":        {"Unopened":0,"Normal":0,"Bronze":0,"Silver":0,"Gold":0,"Platinum":0,"Master":0},
        "EV [Evade Rate]":        {"Unopened":0,"Normal":0,"Bronze":0,"Silver":0,"Gold":0,"Platinum":0,"Master":0},
    },
    "currentRank": None
}

for filename in ["seals_data.json", "seals_data_alphamon.json", "seals_data_omegamon.json"]:
    with open(filename, encoding="utf-8") as f:
        data = json.load(f)

    if "Digital Vacation AT Seal" not in data["seals"]:
        data["seals"]["Digital Vacation AT Seal"] = NEW_SEAL
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"{filename}: agregada — {len(data['seals'])} seals total")
    else:
        print(f"{filename}: ya la tenia — {len(data['seals'])} seals total")
