from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import pickle
import numpy as np
import random
import json
import os
from datetime import datetime

app = FastAPI(title="Vidyut Cloud API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Cloud Storage Simulation ---
DATA_DIR = "data"
DB_FILE = os.path.join(DATA_DIR, "cloud_store.json")

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

def save_to_cloud(data):
    current_data = load_from_cloud()
    current_data.append({
        "timestamp": datetime.now().isoformat(),
        **data
    })
    with open(DB_FILE, "w") as f:
        json.dump(current_data, f, indent=4)

def load_from_cloud():
    if not os.path.exists(DB_FILE):
        return []
    with open(DB_FILE, "r") as f:
        return json.load(f)

# Load AI model
try:
    model = pickle.load(open("../model/model.pkl", "rb"))
except Exception as e:
    print(f"Warning: Model could not be loaded: {e}")
    model = None

@app.get("/api")
def home():
    return {"message": "Vidyut Cloud API Running ⚡"}

@app.get("/history")
def get_history():
    # Simulated cloud history fetch
    return [
        {"time": "00:00", "usage": random.randint(30, 50)},
        {"time": "04:00", "usage": random.randint(20, 40)},
        {"time": "08:00", "usage": random.randint(120, 160)},
        {"time": "12:00", "usage": random.randint(80, 110)},
        {"time": "16:00", "usage": random.randint(70, 90)},
        {"time": "20:00", "usage": random.randint(150, 200)},
    ]

@app.get("/predict")
def predict(temperature: float, humidity: float, appliance_usage: float):
    if not model:
        # Fallback if model is missing
        prediction = (temperature * 0.5) + (humidity * 0.2) + (appliance_usage * 15)
    else:
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

@app.post("/upload")
async def upload_bill(file: UploadFile = File(...)):
    # Simulate OCR parsing
    consumption = random.randint(50, 220)
    cost = consumption * 8.5
    
    extracted_data = {
        "filename": file.filename,
        "consumption": consumption,
        "cost": round(cost, 2),
        "period": "March 2026",
        "sync_id": f"cloud_{random.getrandbits(32)}"
    }
    
    # Persistent storage in "cloud"
    save_to_cloud(extracted_data)
    
    return {
        "message": "Bill synchronized to Vidyut Cloud ⚡",
        "extracted_data": extracted_data
    }

# Serving the static frontend
app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")