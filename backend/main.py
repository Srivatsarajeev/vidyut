from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import numpy as np
from sklearn.linear_model import LinearRegression
import pandas as pd
import io
import os
import json
import random
from datetime import datetime
from typing import List

app = FastAPI(title="Vidyut ⚡ – Energy Consumption Analytics Platform")

# Enable CORS for frontend communication
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

def load_from_cloud():
    if not os.path.exists(DB_FILE):
        return []
    try:
        with open(DB_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []

def save_to_cloud(data):
    current_data = load_from_cloud()
    current_data.append({
        "timestamp": datetime.now().isoformat(),
        **data
    })
    try:
        with open(DB_FILE, "w") as f:
            json.dump(current_data, f, indent=4)
    except Exception as e:
        print(f"Error saving to cloud: {e}")

@app.get("/api/health")
def health_check():
    return {"status": "online", "message": "Vidyut Backend ⚡ is running"}

@app.post("/api/predict")
async def predict_usage(data: List[float] = Body(...)):
    """
    Analyzes 12 months of electricity usage and predicts the 13th month.
    Determines eligibility for Karnataka's Gruha Jyothi scheme.
    """
    if len(data) != 12:
        raise HTTPException(status_code=400, detail="Exactly 12 months of data are required.")

    # Prepare data for Linear Regression
    X = np.array(range(12)).reshape(-1, 1)
    y = np.array(data)

    # Train model
    model = LinearRegression()
    model.fit(X, y)

    # Predict next month (index 12)
    next_month_index = np.array([[12]])
    prediction = model.predict(next_month_index)[0]
    prediction = max(0, round(float(prediction), 2))

    # Calculate Analytics
    avg_usage = round(float(np.mean(data)), 2)
    max_usage = round(float(np.max(data)), 2)
    max_month_index = int(np.argmax(data))
    
    # Eligibility Logic (Gruha Jyothi Scheme: <= 200 units free)
    is_eligible = prediction <= 200
    eligibility_status = "Eligible for FREE electricity under Gruha Jyothi ✅" if is_eligible else "Exceeds 200 units ❌ Full bill applicable"

    # Recommendations Logic
    recommendations = []
    if prediction > 200:
        recommendations = [
            "Reduce AC usage during peak summer months.",
            "Switch to energy-efficient LED bulbs.",
            "Turn off unused appliances from the main socket.",
            "Consider using a solar water heater."
        ]
    elif prediction > 150:
        recommendations = [
            "Monitor heavy appliance usage like washing machines.",
            "Keep refrigerator vents clear for better efficiency.",
            "Unplug chargers when not in use."
        ]
    else:
        recommendations = [
            "Great job! Your consumption is well within limits.",
            "Keep up the efficient energy habits."
        ]

    # Sync to Cloud simulation
    sync_id = f"vidyut_cloud_{random.getrandbits(32)}"
    cloud_record = {
        "sync_id": sync_id,
        "type": "Manual Entry",
        "consumption": prediction,
        "is_eligible": is_eligible,
        "inputs": data,
        "average": avg_usage,
        "highest": max_usage
    }
    save_to_cloud(cloud_record)

    return {
        "prediction": prediction,
        "is_eligible": is_eligible,
        "eligibility_status": eligibility_status,
        "analytics": {
            "average": avg_usage,
            "highest": max_usage,
            "peak_month_index": max_month_index
        },
        "recommendations": recommendations,
        "historical_data": data,
        "sync_id": sync_id
    }

@app.post("/api/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    """
    Accepts a CSV file with usage data, returns prediction, and syncs to cloud.
    Expected CSV format: A single column with 12 usage values.
    """
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')), header=None)
        
        # Extract the first column as a list
        usage_data = df.iloc[:, 0].tolist()
        
        if len(usage_data) < 12:
            raise HTTPException(status_code=400, detail="CSV must contain at least 12 months of data.")
        
        # Take only the last 12 months if more are provided
        usage_data = [float(x) for x in usage_data[-12:]]
        
        # Prepare data for Linear Regression
        X = np.array(range(12)).reshape(-1, 1)
        y = np.array(usage_data)

        # Train model
        model = LinearRegression()
        model.fit(X, y)

        # Predict next month (index 12)
        next_month_index = np.array([[12]])
        prediction = model.predict(next_month_index)[0]
        prediction = max(0, round(float(prediction), 2))

        # Calculate Analytics
        avg_usage = round(float(np.mean(usage_data)), 2)
        max_usage = round(float(np.max(usage_data)), 2)
        max_month_index = int(np.argmax(usage_data))
        
        is_eligible = prediction <= 200
        eligibility_status = "Eligible for FREE electricity under Gruha Jyothi ✅" if is_eligible else "Exceeds 200 units ❌ Full bill applicable"

        # Recommendations Logic
        recommendations = []
        if prediction > 200:
            recommendations = [
                "Reduce AC usage during peak summer months.",
                "Switch to energy-efficient LED bulbs.",
                "Turn off unused appliances from the main socket.",
                "Consider using a solar water heater."
            ]
        elif prediction > 150:
            recommendations = [
                "Monitor heavy appliance usage like washing machines.",
                "Keep refrigerator vents clear for better efficiency.",
                "Unplug chargers when not in use."
            ]
        else:
            recommendations = [
                "Great job! Your consumption is well within limits.",
                "Keep up the efficient energy habits."
            ]

        # Sync to Cloud simulation
        sync_id = f"vidyut_cloud_{random.getrandbits(32)}"
        cloud_record = {
            "sync_id": sync_id,
            "type": f"CSV Upload ({file.filename})",
            "consumption": prediction,
            "is_eligible": is_eligible,
            "inputs": usage_data,
            "average": avg_usage,
            "highest": max_usage
        }
        save_to_cloud(cloud_record)

        return {
            "prediction": prediction,
            "is_eligible": is_eligible,
            "eligibility_status": eligibility_status,
            "analytics": {
                "average": avg_usage,
                "highest": max_usage,
                "peak_month_index": max_month_index
            },
            "recommendations": recommendations,
            "historical_data": usage_data,
            "sync_id": sync_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")

@app.get("/api/cloud-records")
def get_cloud_records():
    """
    Returns the history of synced cloud records.
    """
    return load_from_cloud()

@app.post("/api/sync")
async def sync_data(data: List[float] = Body(...)):
    """
    Explicitly syncs the current usage inputs to the cloud.
    """
    if len(data) != 12:
        raise HTTPException(status_code=400, detail="Exactly 12 months of data are required.")
    
    avg_usage = round(float(np.mean(data)), 2)
    max_usage = round(float(np.max(data)), 2)
    
    X = np.array(range(12)).reshape(-1, 1)
    y = np.array(data)
    model = LinearRegression()
    model.fit(X, y)
    next_month_index = np.array([[12]])
    prediction = max(0, round(float(model.predict(next_month_index)[0]), 2))
    is_eligible = prediction <= 200

    sync_id = f"vidyut_cloud_{random.getrandbits(32)}"
    cloud_record = {
        "sync_id": sync_id,
        "type": "Manual Cloud Sync",
        "consumption": prediction,
        "is_eligible": is_eligible,
        "inputs": data,
        "average": avg_usage,
        "highest": max_usage
    }
    save_to_cloud(cloud_record)
    return {"status": "success", "sync_id": sync_id, "message": "Dashboard synced to Vidyut Cloud ⚡"}

# Mount the static frontend directory
frontend_path = os.path.join(os.path.dirname(__file__), "../frontend")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
else:
    print(f"Warning: Frontend directory not found at {frontend_path}")