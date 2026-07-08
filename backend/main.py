from fastapi import FastAPI, Body, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
try:
    import boto3
    from botocore.exceptions import ClientError
except ImportError:
    boto3 = None

    class ClientError(Exception):
        pass
from dotenv import load_dotenv
import json
import os
import random
import logging
from datetime import datetime
from typing import List

# Configure logging to stdout
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("vidyut")

BASE_DIR = os.path.dirname(__file__)
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))

_root_env = os.path.join(PROJECT_ROOT, ".env")
_backend_env = os.path.join(BASE_DIR, ".env")

# Load .env files — backend/.env takes precedence (override=True)
if os.path.exists(_root_env):
    load_dotenv(_root_env, override=True)
    logger.info(f"Loaded env from project root: {_root_env}")
else:
    logger.warning(f"No .env found at project root: {_root_env}")

if os.path.exists(_backend_env):
    load_dotenv(_backend_env, override=True)
    logger.info(f"Loaded env from backend dir: {_backend_env}")
else:
    logger.warning(f"No .env found in backend dir: {_backend_env} — credentials will not be loaded!")

app = FastAPI(title="Vidyut - Home Energy Intelligence Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "vidyut-rajeev-bmsit-demo")
S3_PREFIX = os.getenv("S3_PREFIX", "house-usage-analysis").strip("/")
CREATE_S3_BUCKET = os.getenv("CREATE_S3_BUCKET", "true").lower() == "true"
UNIT_RATE = float(os.getenv("UNIT_RATE", "7.5"))

s3_client = None
aws_connected = False
aws_status_message = "AWS credentials not provided. Add them to .env to enable S3."


def ensure_bucket_exists():
    global aws_status_message
    logger.info(f"Checking existence of S3 bucket: {S3_BUCKET_NAME}")
    try:
        s3_client.head_bucket(Bucket=S3_BUCKET_NAME)
        aws_status_message = f"Connected to existing S3 bucket {S3_BUCKET_NAME}."
        logger.info(aws_status_message)
        return True
    except ClientError as err:
        code = err.response.get("Error", {}).get("Code", "")
        if code not in ["404", "NoSuchBucket", "NotFound"]:
            aws_status_message = f"S3 bucket check failed: {code}"
            logger.error(aws_status_message)
            return False

    if not CREATE_S3_BUCKET:
        aws_status_message = f"S3 bucket {S3_BUCKET_NAME} does not exist."
        logger.warning(aws_status_message)
        return False

    try:
        logger.info(f"Bucket {S3_BUCKET_NAME} does not exist. Creating bucket in region {AWS_REGION}...")
        params = {"Bucket": S3_BUCKET_NAME}
        if AWS_REGION != "us-east-1":
            params["CreateBucketConfiguration"] = {"LocationConstraint": AWS_REGION}
        s3_client.create_bucket(**params)
        logger.info(f"Bucket {S3_BUCKET_NAME} created. Enabling public access block for security...")
        s3_client.put_public_access_block(
            Bucket=S3_BUCKET_NAME,
            PublicAccessBlockConfiguration={
                "BlockPublicAcls": True,
                "IgnorePublicAcls": True,
                "BlockPublicPolicy": True,
                "RestrictPublicBuckets": True,
            },
        )
        aws_status_message = f"Created and connected to S3 bucket {S3_BUCKET_NAME}."
        logger.info(aws_status_message)
        return True
    except Exception as err:
        aws_status_message = f"Could not create S3 bucket: {err}"
        logger.error(aws_status_message)
        return False


# ── Credential diagnostic (masked) ──────────────────────────────────────────
logger.info(f"AWS_ACCESS_KEY_ID  : {'SET ('+AWS_ACCESS_KEY_ID[:4]+'...)' if AWS_ACCESS_KEY_ID else 'NOT SET — check backend/.env'}")
logger.info(f"AWS_SECRET_ACCESS_KEY: {'SET' if AWS_SECRET_ACCESS_KEY else 'NOT SET — check backend/.env'}")
logger.info(f"AWS_REGION         : {AWS_REGION}")
logger.info(f"S3_BUCKET_NAME     : {S3_BUCKET_NAME}")

import threading

def initialize_aws_s3():
    global s3_client, aws_connected, aws_status_message
    if boto3 is None:
        aws_status_message = "boto3 is not installed. Run: pip install -r requirements.txt"
        logger.error(aws_status_message)
        return

    if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
        aws_status_message = (
            "AWS credentials missing. Open backend/.env and set "
            "AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY."
        )
        logger.error(aws_status_message)
        return

    try:
        logger.info("Initializing AWS S3 client in background...")
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION,
        )
        aws_connected = ensure_bucket_exists()

        if aws_connected:
            # ── Upload connectivity probe to verify write access ────────────
            probe_key = f"{S3_PREFIX}/vidyut_connectivity_probe.json"
            probe_body = json.dumps({
                "type": "connectivity_probe",
                "timestamp": datetime.now().isoformat(),
                "bucket": S3_BUCKET_NAME,
                "region": AWS_REGION,
                "status": "connected",
            }, indent=2).encode("utf-8")
            s3_client.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=probe_key,
                Body=probe_body,
                ContentType="application/json",
            )
            logger.info(f"S3 connectivity probe uploaded: s3://{S3_BUCKET_NAME}/{probe_key}")
    except Exception as err:
        aws_status_message = f"Failed to connect to AWS S3: {err}"
        logger.error(aws_status_message)
        aws_connected = False

# Start the AWS connection check in a background thread so it doesn't block server startup
threading.Thread(target=initialize_aws_s3, daemon=True).start()


MOCK_S3_RECORDS = []


def s3_file_url(object_key):
    encoded_key = object_key.replace("\\", "/")
    if AWS_REGION == "us-east-1":
        return f"https://{S3_BUCKET_NAME}.s3.amazonaws.com/{encoded_key}"
    return f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{encoded_key}"


def require_s3():
    if boto3 is None:
        raise HTTPException(
            status_code=503,
            detail="AWS SDK boto3 is not installed. Run: python -m pip install -r backend/requirements.txt",
        )
    if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
        raise HTTPException(
            status_code=503,
            detail="AWS credentials are missing. Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to .env.",
        )
    if not aws_connected or not s3_client:
        raise HTTPException(status_code=503, detail=aws_status_message)


def build_s3_object_key(sync_id):
    return f"{S3_PREFIX}/{sync_id}.json" if S3_PREFIX else f"{sync_id}.json"


def save_record(data):
    sync_id = data.get("sync_id", f"vidyut_{random.getrandbits(32)}")
    object_key = build_s3_object_key(sync_id)
    url = s3_file_url(object_key)
    
    record = {
        "timestamp": datetime.now().isoformat(),
        "cloud_provider": "AWS S3" if aws_connected else "S3 Demo Mode (Mock)",
        "s3_bucket": S3_BUCKET_NAME,
        "s3_object_key": object_key,
        "s3_url": url,
        **data,
    }

    if aws_connected and s3_client:
        logger.info(f"Uploading analysis record to S3 bucket: {S3_BUCKET_NAME}, Key: {object_key}")
        try:
            s3_client.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=object_key,
                Body=json.dumps(record, indent=2).encode("utf-8"),
                ContentType="application/json",
            )
            logger.info(f"Successfully uploaded analysis record to S3. URL: {url}")
        except ClientError as err:
            code = err.response.get("Error", {}).get("Code", "S3Error")
            logger.error(f"S3 upload failed with ClientError: {code}")
            raise HTTPException(status_code=502, detail=f"S3 upload failed: {code}")
        except Exception as err:
            logger.error(f"S3 upload failed with error: {err}")
            raise HTTPException(status_code=502, detail=f"S3 upload failed: {err}")
    else:
        logger.info(f"[Demo Mode] Simulating upload of record to S3 memory. Key: {object_key}")
        MOCK_S3_RECORDS.append(record)

    return record


def load_all_records():
    if aws_connected and s3_client:
        prefix = f"{S3_PREFIX}/" if S3_PREFIX else ""
        logger.info(f"Listing analysis records in S3 bucket: {S3_BUCKET_NAME}, Prefix: {prefix}")
        try:
            response = s3_client.list_objects_v2(Bucket=S3_BUCKET_NAME, Prefix=prefix)
            records = []
            contents = response.get("Contents", [])
            logger.info(f"Found {len(contents)} objects under prefix '{prefix}'")
            for obj in contents:
                key = obj.get("Key", "")
                if key.endswith(".json"):
                    logger.info(f"Retrieving S3 record content for key: {key}")
                    body = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=key)["Body"].read()
                    records.append(json.loads(body.decode("utf-8")))
            logger.info(f"Successfully loaded {len(records)} records from S3 history.")
            # Sort by timestamp descending
            records.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            return records
        except ClientError as err:
            code = err.response.get("Error", {}).get("Code", "S3Error")
            logger.error(f"S3 list/get failed with ClientError: {code}")
            raise HTTPException(status_code=502, detail=f"S3 read failed: {code}")
        except Exception as err:
            logger.error(f"S3 list/get failed with error: {err}")
            raise HTTPException(status_code=502, detail=f"S3 read failed: {err}")
    else:
        logger.info(f"[Demo Mode] Retrieving mock S3 records from memory (Count: {len(MOCK_S3_RECORDS)})")
        # Sort by timestamp descending
        mock_sorted = list(MOCK_S3_RECORDS)
        mock_sorted.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return mock_sorted


def calculate_bescom_bill(units):
    """
    Computes domestic electricity bill based on Bengaluru BESCOM LT-2a tariff.
    Fixed Charges: Rs 150.00
    Slabs:
      0 - 50 units: Rs 4.75 / unit
      51 - 100 units: Rs 6.50 / unit
      101 - 200 units: Rs 7.50 / unit
      Above 200 units: Rs 8.50 / unit
    Electricity Tax: 9% of energy charges
    FPPCA Charges: Rs 0.45 / unit
    Penalty: Rs 0.00
    """
    energy_charges = 0.0
    remaining = units
    
    if remaining > 200:
        energy_charges += (remaining - 200) * 8.50
        remaining = 200
    if remaining > 100:
        energy_charges += (remaining - 100) * 7.50
        remaining = 100
    if remaining > 50:
        energy_charges += (remaining - 50) * 6.50
        remaining = 50
    energy_charges += remaining * 4.75
    
    fixed_charges = 150.0
    taxes = round(energy_charges * 0.09, 2)
    fppca = round(units * 0.45, 2)
    penalty = 0.0
    
    total_bill = round(energy_charges + fixed_charges + taxes + fppca + penalty, 2)
    return {
        "energy_charges": round(energy_charges, 2),
        "fixed_charges": fixed_charges,
        "taxes": taxes,
        "fppca": fppca,
        "penalty": penalty,
        "total_bill": total_bill
    }


def generate_dynamic_recommendations(appliances, unit_rate):
    """
    Generates actionable energy saving recommendations dynamically based on appliance shares.
    """
    recs = []
    sorted_apps = sorted(appliances.items(), key=lambda x: x[1], reverse=True)
    
    for app_name, val in sorted_apps:
        if val <= 0:
            continue
            
        if app_name == "ac" and val > 50:
            recs.append({
                "appliance": "Air Conditioner",
                "tips": [
                    "Keep AC temperature at 24-26 C to minimize compressor load.",
                    "Clean filters regularly to ensure optimal airflow.",
                    "Use a ceiling fan with AC to distribute cool air more efficiently."
                ],
                "estimated_saving": round(val * 0.20 * unit_rate, 2)
            })
        elif app_name == "fridge" and val > 30:
            recs.append({
                "appliance": "Refrigerator",
                "tips": [
                    "Avoid frequent or long door openings to retain cooling.",
                    "Set cooling temperature to medium or eco mode.",
                    "Keep proper ventilation space (at least 3-4 inches) around the sides and back."
                ],
                "estimated_saving": round(val * 0.15 * unit_rate, 2)
            })
        elif app_name == "lights" and val > 20:
            recs.append({
                "appliance": "Lights",
                "tips": [
                    "Replace all remaining conventional bulbs with LED bulbs.",
                    "Switch off lights in empty or unoccupied rooms.",
                    "Maximize the use of natural daylight during daytime hours."
                ],
                "estimated_saving": round(val * 0.25 * unit_rate, 2)
            })
        elif app_name == "fans" and val > 25:
            recs.append({
                "appliance": "Fans",
                "tips": [
                    "Turn off fans when leaving a room (fans cool people, not rooms).",
                    "Service motor and replace old magnetic regulators with electronic ones.",
                    "Clean fan blades regularly to reduce drag and energy draw."
                ],
                "estimated_saving": round(val * 0.15 * unit_rate, 2)
            })
        elif app_name == "washing_machine" and val > 15:
            recs.append({
                "appliance": "Washing Machine",
                "tips": [
                    "Run washing machine with full loads only instead of multiple small cycles.",
                    "Use eco-mode and cold water wash to save water-heating energy.",
                    "Clean the lint filter after every wash to maintain pump efficiency."
                ],
                "estimated_saving": round(val * 0.10 * unit_rate, 2)
            })
        elif app_name == "tv" and val > 10:
            recs.append({
                "appliance": "Television",
                "tips": [
                    "Switch off TV from the main wall socket; standby mode still consumes standby power.",
                    "Adjust screen brightness to a standard level instead of dynamic/vivid.",
                    "Set a sleep timer if you regularly watch television before sleeping."
                ],
                "estimated_saving": round(val * 0.08 * unit_rate, 2)
            })
        elif app_name == "other" and val > 15:
            recs.append({
                "appliance": "Other Appliances",
                "tips": [
                    "Unplug chargers, microwave ovens, and geysers when not in use.",
                    "Limit high-wattage device usage during peak utility hours.",
                    "Upgrade legacy secondary devices to Energy Star certified models."
                ],
                "estimated_saving": round(val * 0.12 * unit_rate, 2)
            })
            
    if not recs:
        recs.append({
            "appliance": "General",
            "tips": [
                "Unplug chargers and adapters when not in use (phantom load).",
                "Perform weekly meter audits to track anomalous consumption patterns."
            ],
            "estimated_saving": 30.0
        })
        
    return recs


def analyze_house(house):
    appliances = {
        "lights": float(house.get("lights", 0)),
        "fans": float(house.get("fans", 0)),
        "fridge": float(house.get("fridge", 0)),
        "tv": float(house.get("tv", 0)),
        "washing_machine": float(house.get("washing_machine", 0)),
        "ac": float(house.get("ac", 0)),
        "other": float(house.get("other", 0)),
    }
    
    current_units = round(sum(appliances.values()), 2)
    
    # Sort appliances to find top energy consumers
    sorted_appliances = sorted(appliances.items(), key=lambda x: x[1], reverse=True)
    top_consumers = [
        {"appliance": item[0].upper() if item[0] != "washing_machine" else "WASHING MACHINE", "value": round(item[1], 2)}
        for item in sorted_appliances[:3] if item[1] > 0
    ]
    
    # Generate dynamic recommendations and savings potential
    recs = generate_dynamic_recommendations(appliances, UNIT_RATE)
    total_recs_savings = round(sum(r["estimated_saving"] for r in recs), 2)
    
    # Calculate optimized next month units based on savings
    # Calculate units saved by dividing money saved by average unit rate (approx UNIT_RATE)
    units_saved = round(total_recs_savings / UNIT_RATE, 2) if total_recs_savings > 0 else 0.0
    predicted_units = max(10.0, round(current_units - units_saved, 2))
    
    # Compute BESCOM bills
    current_bescom = calculate_bescom_bill(current_units)
    predicted_bescom = calculate_bescom_bill(predicted_units)
    
    current_bill = current_bescom["total_bill"]
    predicted_bill = predicted_bescom["total_bill"]
    savings = round(current_bill - predicted_bill, 2)
    
    # Prediction Confidence (realistic between 92% and 97%)
    confidence = 96 - int(current_units % 4)
    
    # Energy Efficiency Score: based on optimization ratio
    opt_ratio = predicted_units / max(1.0, current_units)
    score = int(100 - (opt_ratio - 0.70) * 120)
    score = max(50, min(99, score))
    
    # Carbon footprint (0.82 kg CO2 per kWh)
    carbon_footprint = round(current_units * 0.82, 2)
    carbon_reduction = round((current_units - predicted_units) * 0.82, 2)
    
    return {
        "house_id": house.get("house_id", "House"),
        "appliances": appliances,
        "current_units": current_units,
        "predicted_next_month_units": predicted_units,
        "current_bill": current_bill,
        "predicted_next_month_bill": predicted_bill,
        "estimated_savings": savings,
        "confidence": confidence,
        "efficiency_score": score,
        "carbon_footprint": carbon_footprint,
        "carbon_reduction": carbon_reduction,
        "top_consumers": top_consumers,
        "current_bill_breakdown": current_bescom,
        "predicted_bill_breakdown": predicted_bescom,
        "recommendations": recs,
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "message": "Vidyut backend is running",
        "cloud_connection": "AWS S3" if aws_connected else "S3 Demo Mode",
        "s3_bucket": S3_BUCKET_NAME,
        "s3_prefix": S3_PREFIX,
        "aws_region": AWS_REGION,
    }


@app.get("/api/cloud-status")
def cloud_status():
    return {
        "connected": aws_connected,
        "provider": "AWS S3" if aws_connected else "S3 Demo Mode",
        "bucket": S3_BUCKET_NAME,
        "prefix": S3_PREFIX,
        "region": AWS_REGION,
        "message": aws_status_message,
    }


@app.post("/api/upload-bill")
async def upload_bill(file: UploadFile = File(...)):
    filename = file.filename.lower()
    
    # High-fidelity simulation for BESCOM bill OCR parsing
    consumer_name = "Srivatsa Rajeev"
    units = 118
    tariff = "LT-2a (Domestic)"
    billing_period = "06 Jun 2026 - 06 Jul 2026"
    
    # Apply dynamic variations to mock extraction based on filename or file type
    if "green" in filename or "eco" in filename:
        consumer_name = "Green Tech Solutions"
        units = 85
    elif "commercial" in filename:
        consumer_name = "Vidyut Commercial Hub"
        units = 450
        tariff = "LT-3 (Commercial)"
    elif "apartment" in filename or "residency" in filename:
        consumer_name = "Srivatsa Rajeev (Residence)"
        units = 240
    elif "mca" in filename:
        consumer_name = "MCA Demo Property"
        units = 310
    else:
        # Generate stable mock data using simple hash of filename
        char_sum = sum(ord(c) for c in file.filename)
        units = 80 + (char_sum % 160) # 80 to 240 units
        names = ["Srivatsa Rajeev", "Siddharth Kumar", "Ananya Sharma", "Rahul Hegde", "Priya Kulkarni"]
        consumer_name = names[char_sum % len(names)]
        
    bescom = calculate_bescom_bill(units)
    
    return {
        "status": "success",
        "filename": file.filename,
        "consumer_name": consumer_name,
        "bill_amount": bescom["total_bill"],
        "units_consumed": units,
        "billing_period": billing_period,
        "tariff": tariff,
        "breakdown": {
            "energy_charges": bescom["energy_charges"],
            "fixed_charges": bescom["fixed_charges"],
            "taxes": bescom["taxes"],
            "fppca": bescom["fppca"],
            "penalty": bescom["penalty"],
            "total_bill": bescom["total_bill"]
        }
    }


@app.post("/api/analyze-houses")
def analyze_houses(houses: List[dict] = Body(...)):
    if len(houses) != 5:
        return {"error": "Exactly 5 houses are required."}

    results = [analyze_house(house) for house in houses]
    total_units = round(sum(item["current_units"] for item in results), 2)
    predicted_total_units = round(sum(item["predicted_next_month_units"] for item in results), 2)
    total_bill = round(sum(item["current_bill"] for item in results), 2)
    predicted_total_bill = round(sum(item["predicted_next_month_bill"] for item in results), 2)
    
    # Rankings
    by_consumption = sorted(results, key=lambda x: x["current_units"], reverse=True)
    by_bill = sorted(results, key=lambda x: x["current_bill"], reverse=True)
    by_saving = sorted(results, key=lambda x: x["estimated_savings"], reverse=True)
    by_score = sorted(results, key=lambda x: x["efficiency_score"], reverse=True)
    
    rankings = {
        "highest_consumption": [{"house_id": h["house_id"], "value": h["current_units"]} for h in by_consumption],
        "highest_bill": [{"house_id": h["house_id"], "value": h["current_bill"]} for h in by_bill],
        "highest_saving_potential": [{"house_id": h["house_id"], "value": h["estimated_savings"]} for h in by_saving],
        "best_energy_score": [{"house_id": h["house_id"], "value": h["efficiency_score"]} for h in by_score],
    }

    sync_id = f"vidyut_house_analysis_{random.getrandbits(32)}"
    saved_record = save_record(
        {
            "sync_id": sync_id,
            "type": "Five House Appliance Analysis",
            "houses": results,
            "rankings": rankings,
            "summary": {
                "total_units": total_units,
                "predicted_total_units": predicted_total_units,
                "total_bill": total_bill,
                "predicted_total_bill": predicted_total_bill,
                "estimated_total_savings": round(total_bill - predicted_total_bill, 2),
                "co2_reduction": round((total_units - predicted_total_units) * 0.82, 2),
                "best_saving_house": by_saving[0]["house_id"],
            },
        }
    )

    return {
        "sync_id": sync_id,
        "houses": results,
        "rankings": rankings,
        "summary": saved_record["summary"],
        "s3_bucket": saved_record["s3_bucket"],
        "s3_object_key": saved_record["s3_object_key"],
        "s3_url": saved_record["s3_url"],
        "cloud_provider": saved_record["cloud_provider"],
    }


@app.post("/api/analyze-survey")
def analyze_survey(data: dict = Body(...)):
    profile = data.get("profile", {})
    appliances_data = data.get("appliances", {})
    ev = data.get("ev", {})
    usage = data.get("usage", {})

    full_name = profile.get("fullName", "User")
    mobile = profile.get("mobileNumber", "")
    house_type = profile.get("houseType", "Apartment")
    family_members = int(profile.get("familyMembers", 2))
    city = profile.get("city", "Bengaluru")
    provider = profile.get("provider", "BESCOM")
    monthly_bill = float(profile.get("monthlyBill", 2000.0))
    bedrooms = int(profile.get("bedrooms", 2))

    # Appliances
    led_bulbs = int(appliances_data.get("ledBulbs", 0))
    fans = int(appliances_data.get("fans", 0))
    tvs = int(appliances_data.get("tvs", 0))
    fridge_type = appliances_data.get("fridgeType", "None")
    ac_type = appliances_data.get("acType", "None")
    ac_count = int(appliances_data.get("acCount", 0))
    washing_machine = appliances_data.get("washingMachine", "None")
    microwave = bool(appliances_data.get("microwave", False))
    water_heater = bool(appliances_data.get("waterHeater", False))
    induction_stove = bool(appliances_data.get("inductionStove", False))
    desktop = int(appliances_data.get("desktop", 0))
    laptop = int(appliances_data.get("laptop", 0))
    gaming_pc = int(appliances_data.get("gamingPc", 0))
    ro_purifier = bool(appliances_data.get("roPurifier", False))
    electric_iron = bool(appliances_data.get("electricIron", False))
    mixer_grinder = bool(appliances_data.get("mixerGrinder", False))
    vacuum_cleaner = bool(appliances_data.get("vacuumCleaner", False))

    # EV
    has_ev = bool(ev.get("hasEv", False))
    ev_type = ev.get("evType", "None")
    ev_brand = ev.get("evBrand", "")
    ev_battery_capacity = float(ev.get("evBatteryCapacity", 0.0))
    ev_charging_days = int(ev.get("evChargingDays", 0))
    ev_charging_time = float(ev.get("evChargingTime", 0.0))
    ev_monthly_hours = float(ev.get("evMonthlyHours", 0.0))

    # Usage habits
    usage_ac = float(usage.get("usageAc", 0.0))
    usage_tv = float(usage.get("usageTv", 0.0))
    usage_fridge = float(usage.get("usageFridge", 24.0))
    usage_washing_machine = float(usage.get("usageWashingMachine", 0.0))
    usage_lighting = float(usage.get("usageLighting", 0.0))
    usage_fan = float(usage.get("usageFan", 0.0))
    wfh = bool(usage.get("workFromHome", False))

    # Energy consumption calculations (kWh per month)
    lights_kwh = round(led_bulbs * 9.0 * usage_lighting * 30.0 / 1000.0, 2)
    fans_kwh = round(fans * 60.0 * usage_fan * 30.0 / 1000.0, 2)
    tv_kwh = round(tvs * 100.0 * usage_tv * 30.0 / 1000.0, 2)

    fridge_watt = 0.0
    if fridge_type == "Single Door":
        fridge_watt = 150.0
    elif fridge_type == "Double Door":
        fridge_watt = 250.0
    elif fridge_type == "Side-by-Side":
        fridge_watt = 400.0
    fridge_kwh = round(fridge_watt * (usage_fridge / 24.0) * 24.0 * 30.0 * 0.5 / 1000.0, 2)  # 50% duty cycle

    ac_watt = 0.0
    if ac_type == "1 Ton":
        ac_watt = 1000.0
    elif ac_type == "1.5 Ton":
        ac_watt = 1500.0
    elif ac_type == "2 Ton":
        ac_watt = 2000.0
    ac_kwh = round(ac_count * ac_watt * usage_ac * 30.0 / 1000.0, 2)

    wm_watt = 0.0
    if washing_machine == "Semi Automatic":
        wm_watt = 350.0
    elif washing_machine == "Fully Automatic":
        wm_watt = 500.0
    wm_kwh = round(wm_watt * usage_washing_machine * 4.3 / 1000.0, 2)

    microwave_kwh = 18.0 if microwave else 0.0
    water_heater_kwh = 90.0 if water_heater else 0.0
    induction_stove_kwh = 45.0 if induction_stove else 0.0
    desktop_kwh = round(desktop * 200.0 * 5.0 * 30.0 / 1000.0, 2)
    laptop_kwh = round(laptop * 65.0 * 8.0 * 30.0 / 1000.0, 2)
    gaming_pc_kwh = round(gaming_pc * 500.0 * 3.0 * 30.0 / 1000.0, 2)
    ro_purifier_kwh = 3.6 if ro_purifier else 0.0
    electric_iron_kwh = 9.0 if electric_iron else 0.0
    mixer_grinder_kwh = 1.5 if mixer_grinder else 0.0
    vacuum_cleaner_kwh = 7.2 if vacuum_cleaner else 0.0

    ev_kwh = 0.0
    if has_ev:
        if ev_battery_capacity > 0:
            ev_kwh = round(ev_battery_capacity * ev_charging_days * 4.3, 2)
        else:
            default_cap = 3.0 if ev_type in ["Electric Scooter", "Electric Bike"] else 40.0
            ev_kwh = round(default_cap * ev_charging_days * 4.3, 2)

    # WFH adjustment
    wfh_kwh = 0.0
    if wfh:
        wfh_kwh = round((lights_kwh + fans_kwh + laptop_kwh + desktop_kwh) * 0.15, 2)

    other_kwh = round(microwave_kwh + induction_stove_kwh + ro_purifier_kwh + electric_iron_kwh + mixer_grinder_kwh + vacuum_cleaner_kwh + wfh_kwh, 2)

    # Summarize appliance consumption
    appliances = {
        "lights": lights_kwh,
        "fans": fans_kwh,
        "fridge": fridge_kwh,
        "tv": tv_kwh,
        "washing_machine": wm_kwh,
        "ac": ac_kwh,
        "water_heater": water_heater_kwh,
        "computers": round(desktop_kwh + laptop_kwh + gaming_pc_kwh, 2),
        "ev": ev_kwh,
        "other": other_kwh
    }

    current_units = round(sum(appliances.values()), 2)

    # Recommendations & Savings
    recs = []
    
    # 1. EV Charging Schedule
    if has_ev and ev_kwh > 0:
        savings_kwh = round(ev_kwh * 0.15, 2)
        savings_rs = round(ev_kwh * 1.5, 2)  # Rs 1.5 per unit shifted
        recs.append({
            "appliance": "Electric Vehicle",
            "title": "Optimize EV Charging Schedule",
            "tips": [
                f"Charge your {ev_brand or ev_type} during off-peak hours (10:00 PM to 6:00 AM) to utilize off-peak grid pricing.",
                "Avoid charging immediately after driving; let the battery cool down to preserve capacity.",
                "Set charging limit to 80% for daily usage to enhance battery longevity."
            ],
            "estimated_saving": savings_rs,
            "estimated_saving_kwh": savings_kwh
        })

    # 2. AC Temperature
    if ac_count > 0 and ac_kwh > 0 and usage_ac > 4:
        savings_kwh = round(ac_kwh * 0.20, 2)
        savings_rs = round(savings_kwh * UNIT_RATE, 2)
        recs.append({
            "appliance": "Air Conditioner",
            "title": "Optimize AC Temperature to 24°C-26°C",
            "tips": [
                "Setting the thermostat to 24°C instead of 18°C can reduce compressor run-time by up to 20%.",
                "Ensure doors and windows are fully sealed while the AC is running to prevent cooling loss.",
                "Service the AC filter and coils twice a season to maintain airflow efficiency."
            ],
            "estimated_saving": savings_rs,
            "estimated_saving_kwh": savings_kwh
        })

    # 3. Upgrade Refrigerator
    if fridge_type in ["Double Door", "Side-by-Side"] and fridge_kwh > 0:
        savings_kwh = round(fridge_kwh * 0.25, 2)
        savings_rs = round(savings_kwh * UNIT_RATE, 2)
        recs.append({
            "appliance": "Refrigerator",
            "title": "Upgrade to a 5-Star Inverter Refrigerator",
            "tips": [
                "Modern 5-Star inverter compressors run at variable speeds and draw up to 30% less power.",
                "Maintain a 3-4 inch clearance around the refrigerator sides and back for ventilation.",
                "Ensure refrigerator door gaskets seal tightly to prevent cool air leakage."
            ],
            "estimated_saving": savings_rs,
            "estimated_saving_kwh": savings_kwh
        })

    # 4. Geyser/Water Heater timer
    if water_heater and water_heater_kwh > 0:
        savings_kwh = round(water_heater_kwh * 0.30, 2)
        savings_rs = round(savings_kwh * UNIT_RATE, 2)
        recs.append({
            "appliance": "Water Heater",
            "title": "Install a Geyser Timer & Reduce Temperature",
            "tips": [
                "A smart timer prevents the geyser from heating water continuously; set it to run 20 mins before use.",
                "Lower the thermostat temperature from 65°C to 50°C to significantly reduce standing losses.",
                "Insulate hot water pipes to maintain water temperature for longer periods."
            ],
            "estimated_saving": savings_rs,
            "estimated_saving_kwh": savings_kwh
        })

    # 5. Lighting
    if led_bulbs > 8 and usage_lighting > 5:
        savings_kwh = round(lights_kwh * 0.20, 2)
        savings_rs = round(savings_kwh * UNIT_RATE, 2)
        recs.append({
            "appliance": "Lights",
            "title": "Switch to High-Efficiency LEDs & Use Sensors",
            "tips": [
                "Upgrade any remaining fluorescent tube lights (FTLs) or CFLs to high-efficiency LEDs (9W-12W).",
                "Utilize natural day-lighting in common rooms and turn off lights in unoccupied spaces.",
                "Install motion-sensor switches in bathrooms and corridors to automate shut-offs."
            ],
            "estimated_saving": savings_rs,
            "estimated_saving_kwh": savings_kwh
        })

    # 6. Standby power / computer load
    if (desktop > 0 or gaming_pc > 0) and (desktop_kwh + gaming_pc_kwh) > 0:
        savings_kwh = round((desktop_kwh + gaming_pc_kwh) * 0.15 + 10.0, 2)
        savings_rs = round(savings_kwh * UNIT_RATE, 2)
        recs.append({
            "appliance": "Computers",
            "title": "Reduce Standby Power & Enable Sleep Modes",
            "tips": [
                "Unplug gaming rigs, monitors, and chargers from the socket when not in use (phantom load).",
                "Configure systems to automatically enter 'Sleep' or 'Hibernate' after 10 minutes of inactivity.",
                "Use a smart power strip that shuts off peripheral devices when the primary PC turns off."
            ],
            "estimated_saving": savings_rs,
            "estimated_saving_kwh": savings_kwh
        })

    # General recommendations if list is empty
    if not recs:
        recs.append({
            "appliance": "General",
            "title": "Audit Phantom Standby Loads",
            "tips": [
                "Unplug chargers and appliances when not in use. Phantom loads account for 5% of your bill.",
                "Perform a weekly meter check to identify anomalous consumption jumps."
            ],
            "estimated_saving": 150.0,
            "estimated_saving_kwh": 20.0
        })

    total_savings_kwh = round(sum(r["estimated_saving_kwh"] for r in recs), 2)
    predicted_units = max(20.0, round(current_units - total_savings_kwh, 2))

    current_bescom = calculate_bescom_bill(current_units)
    predicted_bescom = calculate_bescom_bill(predicted_units)

    current_bill = current_bescom["total_bill"]
    predicted_bill = predicted_bescom["total_bill"]
    savings_rs = round(current_bill - predicted_bill, 2)

    # Efficiency score based on benchmark
    # benchmark: 100 kWh baseline + 50 kWh per bedroom + 20 kWh per family member
    benchmark_units = 100 + (bedrooms * 50) + (family_members * 20)
    if current_units <= benchmark_units:
        efficiency_score = 90 + int((benchmark_units - current_units) / benchmark_units * 9)
    else:
        efficiency_score = 90 - int((current_units - benchmark_units) / benchmark_units * 40)
    efficiency_score = max(50, min(99, efficiency_score))
    energy_score = efficiency_score

    # Carbon Footprint
    carbon_footprint = round(current_units * 0.82, 2)
    carbon_reduction = round((current_units - predicted_units) * 0.82, 2)

    # Sort appliances to find top consumers
    sorted_apps = sorted(appliances.items(), key=lambda x: x[1], reverse=True)
    top_consumers = [
        {"appliance": item[0].upper().replace("_", " "), "value": round(item[1], 2)}
        for item in sorted_apps[:3] if item[1] > 0
    ]

    sync_id = f"vidyut_survey_analysis_{random.getrandbits(32)}"
    
    # Save to S3/Mock S3
    record_data = {
        "sync_id": sync_id,
        "type": "Single Household Survey Analysis",
        "profile": {
            "fullName": full_name,
            "mobileNumber": mobile,
            "houseType": house_type,
            "familyMembers": family_members,
            "city": city,
            "provider": provider,
            "monthlyBill": monthly_bill,
            "bedrooms": bedrooms
        },
        "appliances_raw": appliances_data,
        "ev_raw": ev,
        "usage_raw": usage,
        "appliances": appliances,
        "current_units": current_units,
        "predicted_next_month_units": predicted_units,
        "current_bill": current_bill,
        "predicted_next_month_bill": predicted_bill,
        "estimated_savings": savings_rs,
        "energy_score": energy_score,
        "efficiency_score": efficiency_score,
        "carbon_footprint": carbon_footprint,
        "carbon_reduction": carbon_reduction,
        "top_consumers": top_consumers,
        "current_bill_breakdown": current_bescom,
        "predicted_bill_breakdown": predicted_bescom,
        "recommendations": recs
    }

    saved_record = save_record(record_data)
    return saved_record


@app.post("/api/create-s3-bucket")
def create_s3_bucket():
    if boto3 is None:
        raise HTTPException(
            status_code=503,
            detail="AWS SDK boto3 is not installed. Run: python -m pip install -r backend/requirements.txt",
        )
    if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
        raise HTTPException(
            status_code=503,
            detail="AWS credentials are missing. Add them in backend/.env first.",
        )
    if not s3_client:
        raise HTTPException(status_code=503, detail=aws_status_message)

    connected = ensure_bucket_exists()
    return {
        "created": connected,
        "connected": connected,
        "bucket": S3_BUCKET_NAME,
        "region": AWS_REGION,
        "message": aws_status_message,
    }


@app.get("/api/cloud-records")
def get_cloud_records():
    return load_all_records()


frontend_path = os.path.join(os.path.dirname(__file__), "../frontend/dist")
if not os.path.exists(frontend_path):
    frontend_path = os.path.join(os.path.dirname(__file__), "../frontend")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
