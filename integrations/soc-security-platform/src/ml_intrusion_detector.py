from sklearn.ensemble import IsolationForest
import pandas as pd

def detect_intrusion(file):

    data = pd.read_csv(file)

    model = IsolationForest(contamination=0.05)

    data["anomaly"] = model.fit_predict(data)

    return data[data["anomaly"] == -1]