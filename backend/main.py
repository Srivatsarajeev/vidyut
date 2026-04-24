from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import pickle
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model
model = pickle.load(open("../model/model.pkl", "rb"))

@app.get("/api")
def home():
    return {"message": "Vidyut API Running ⚡"}

@app.get("/history")
def get_history():
    return [
        {"time": "00:00", "usage": 110},
        {"time": "04:00", "usage": 95},
        {"time": "08:00", "usage": 140},
        {"time": "12:00", "usage": 165},
        {"time": "16:00", "usage": 155},
        {"time": "20:00", "usage": 180},
    ]

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

app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")