from fastapi import FastAPI
import pickle
import numpy as np

app = FastAPI()

# Load model
model = pickle.load(open("../model/model.pkl", "rb"))

@app.get("/")
def home():
    return {"message": "Vidyut API Running ⚡"}

@app.get("/predict")
def predict(temperature: float, humidity: float, appliance_usage: float):
    
    data = np.array([[temperature, humidity, appliance_usage]])
    prediction = model.predict(data)[0]

    if prediction > 150:
        level = "High ⚠️"
    elif prediction > 120:
        level = "Medium"
    else:
        level = "Low"

    return {
        "predicted_energy_consumption": round(prediction, 2),
        "usage_level": level
    }