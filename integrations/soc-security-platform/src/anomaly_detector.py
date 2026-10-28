from sklearn.ensemble import IsolationForest
import pandas as pd

def detect_anomaly(df):

    model = IsolationForest(contamination=0.05)

    df["anomaly"] = model.fit_predict(df)

    return df[df["anomaly"] == -1]