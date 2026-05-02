from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import pickle
import numpy as np
import random
import json
import os
from datetime import datetime, timedelta

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
    model_path = os.path.join(os.path.dirname(__file__), "../model/model.pkl")
    model = pickle.load(open(model_path, "rb"))
except Exception as e:
    print(f"Warning: Model could not be loaded: {e}")
    model = None

@app.get("/api")
def home():
    return {"message": "Vidyut Cloud API Running ⚡"}

@app.get("/history")
def get_history():
    """Returns a realistic 24-hour energy usage curve"""
    history = []
    # Base pattern for a residential home
    # 00-06: Low (sleep)
    # 07-09: High (morning routine)
    # 10-16: Medium (daytime)
    # 17-22: Peak (evening usage)
    # 23-24: Tapering
    
    now = datetime.now()
    for i in range(24):
        hour = (now - timedelta(hours=23-i)).hour
        time_str = f"{hour:02d}:00"
        
        if 0 <= hour <= 6:
            base = 20
        elif 7 <= hour <= 9:
            base = 150
        elif 10 <= hour <= 16:
            base = 80
        elif 17 <= hour <= 22:
            base = 200
        else:
            base = 60
            
        # Add some variation
        usage = base + random.randint(-15, 15)
        history.append({"time": time_str, "usage": max(usage, 10)})
        
    return history

@app.get("/predict")
def predict(temperature: float, humidity: float, appliance_usage: float):
    if not model:
        # Fallback heuristic if model is missing
        prediction = (temperature * 0.8) + (humidity * 0.3) + (appliance_usage * 20)
    else:
        try:
            data = np.array([[temperature, humidity, appliance_usage]])
            prediction = model.predict(data)[0]
        except:
            prediction = (temperature * 0.8) + (humidity * 0.3) + (appliance_usage * 20)

    if prediction > 180:
        level = "High Critical ⚠️"
    elif prediction > 130:
        level = "Medium Load"
    else:
        level = "Optimized"

    return {
        "predicted_energy_consumption": round(float(prediction), 2),
        "usage_level": level
    }

@app.post("/upload")
async def upload_bill(file: UploadFile = File(...)):
    # Simulate OCR parsing with semi-realistic values
    # In a real app, this would use Tesseract or AWS Textract
    consumption = random.randint(140, 350)
    cost = consumption * 7.85
    
    extracted_data = {
        "filename": file.filename,
        "consumption": consumption,
        "cost": round(cost, 2),
        "period": "April 2026",
        "sync_id": f"vidyut_cloud_{random.getrandbits(32)}"
    }
    
    # Persistent storage in "cloud"
    save_to_cloud(extracted_data)
    
    return {
        "message": "Intelligence synchronized to Vidyut Cloud ⚡",
        "extracted_data": extracted_data
    }

# Serving the static frontend
# Note: In production, use a proper web server or serve via FastAPI mount correctly
app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")