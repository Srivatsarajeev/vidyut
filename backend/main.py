from fastapi import FastAPI, Body, HTTPException
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

app = FastAPI(title="Vidyut - Home Electricity Analyzer")

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
        return MOCK_S3_RECORDS


def appliance_advice(appliances):
    tips = []
    total = sum(appliances.values()) or 1
    shares = {name: value / total for name, value in appliances.items()}

    if shares.get("ac", 0) >= 0.2:
        tips.append("AC usage is high. Set AC to 24-26 C, clean filters, and use fans with AC.")
    if shares.get("fridge", 0) >= 0.18:
        tips.append("Fridge usage is high. Avoid frequent door opening and keep temperature on medium.")
    if shares.get("lights", 0) >= 0.15:
        tips.append("Lighting usage is high. Replace old bulbs with LED bulbs and switch off empty rooms.")
    if shares.get("fans", 0) >= 0.15:
        tips.append("Fan usage is high. Turn fans off when rooms are empty and service old fans.")
    if shares.get("washing_machine", 0) >= 0.12:
        tips.append("Washing machine usage is high. Run full loads and avoid daily half-load washing.")
    if shares.get("tv", 0) >= 0.1:
        tips.append("TV usage is noticeable. Switch off from the main plug instead of standby mode.")
    if shares.get("other", 0) >= 0.15:
        tips.append("Other appliances are taking many units. Unplug chargers and avoid idle appliance use.")
    if not tips:
        tips.append("Usage is balanced. Continue switching off idle appliances and tracking weekly units.")

    return tips


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
    high_usage_appliance = max(appliances, key=appliances.get)

    saving_factor = 0.92 if current_units > 250 else 0.95 if current_units > 180 else 0.98
    predicted_units = round(current_units * saving_factor, 2)
    current_bill = round(current_units * UNIT_RATE, 2)
    predicted_bill = round(predicted_units * UNIT_RATE, 2)
    savings = round(current_bill - predicted_bill, 2)

    return {
        "house_id": house.get("house_id", "House"),
        "appliances": appliances,
        "current_units": current_units,
        "predicted_next_month_units": predicted_units,
        "current_bill": current_bill,
        "predicted_next_month_bill": predicted_bill,
        "estimated_savings": savings,
        "highest_usage_appliance": high_usage_appliance,
        "recommendations": appliance_advice(appliances),
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


@app.post("/api/analyze-houses")
def analyze_houses(houses: List[dict] = Body(...)):
    if len(houses) != 5:
        return {"error": "Exactly 5 houses are required."}

    results = [analyze_house(house) for house in houses]
    total_units = round(sum(item["current_units"] for item in results), 2)
    predicted_total_units = round(sum(item["predicted_next_month_units"] for item in results), 2)
    total_bill = round(sum(item["current_bill"] for item in results), 2)
    predicted_total_bill = round(sum(item["predicted_next_month_bill"] for item in results), 2)
    best_saving_house = max(results, key=lambda item: item["estimated_savings"])

    sync_id = f"vidyut_house_analysis_{random.getrandbits(32)}"
    saved_record = save_record(
        {
            "sync_id": sync_id,
            "type": "Five House Appliance Analysis",
            "houses": results,
            "summary": {
                "total_units": total_units,
                "predicted_total_units": predicted_total_units,
                "total_bill": total_bill,
                "predicted_total_bill": predicted_total_bill,
                "estimated_total_savings": round(total_bill - predicted_total_bill, 2),
                "best_saving_house": best_saving_house["house_id"],
            },
        }
    )

    return {
        "sync_id": sync_id,
        "houses": results,
        "summary": saved_record["summary"],
        "s3_bucket": saved_record["s3_bucket"],
        "s3_object_key": saved_record["s3_object_key"],
        "s3_url": saved_record["s3_url"],
        "cloud_provider": saved_record["cloud_provider"],
    }


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


frontend_path = os.path.join(os.path.dirname(__file__), "../frontend")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
