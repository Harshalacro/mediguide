import joblib

model = joblib.load("model.pkl")

def predict_risk(features):
    return model.predict([features])