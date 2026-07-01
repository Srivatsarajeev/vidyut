import sys
import os
import unittest
from unittest.mock import MagicMock, patch

# Mock boto3 client
mock_s3_client = MagicMock()
# Mock head_bucket to return successfully (simulating that the bucket exists)
mock_s3_client.head_bucket.return_value = {}
# Mock list_objects_v2 to return a mock list of objects
mock_s3_client.list_objects_v2.return_value = {
    "Contents": [
        {"Key": "house-usage-analysis/test_record.json"}
    ]
}
# Mock get_object to return a dummy JSON object
mock_response_body = MagicMock()
mock_response_body.read.return_value = b"""{
  "timestamp": "2026-06-30T12:00:00",
  "cloud_provider": "AWS S3",
  "s3_bucket": "vidyut-rajeev-bmsit-demo",
  "s3_object_key": "house-usage-analysis/test_record.json",
  "sync_id": "test_record",
  "type": "Five House Appliance Analysis",
  "summary": {
    "total_units": 100.0,
    "predicted_total_bill": 750.0
  }
}"""
mock_s3_client.get_object.return_value = {"Body": mock_response_body}

# Patch boto3.client BEFORE importing main to intercept the module-level client creation
with patch("boto3.client", return_value=mock_s3_client):
    with patch.dict("os.environ", {
        "AWS_ACCESS_KEY_ID": "mock_access_key",
        "AWS_SECRET_ACCESS_KEY": "mock_secret_key",
        "AWS_REGION": "ap-south-1",
        "S3_BUCKET_NAME": "vidyut-rajeev-bmsit-demo",
        "CREATE_S3_BUCKET": "true"
    }):
        # Ensure backend is in python path
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        import main


class TestS3Integration(unittest.TestCase):

    def setUp(self):
        # Reset mock calls before each test
        mock_s3_client.reset_mock()

    def test_health_check(self):
        response = main.health_check()
        self.assertEqual(response["status"], "online")
        self.assertEqual(response["s3_bucket"], "vidyut-rajeev-bmsit-demo")

    def test_cloud_status(self):
        response = main.cloud_status()
        self.assertTrue(response["connected"])
        self.assertEqual(response["provider"], "AWS S3")

    def test_analyze_houses_and_upload(self):
        houses_data = [
            { "house_id": "House 1", "lights": 10, "fans": 10, "fridge": 10, "tv": 10, "washing_machine": 10, "ac": 10, "other": 10 },
            { "house_id": "House 2", "lights": 10, "fans": 10, "fridge": 10, "tv": 10, "washing_machine": 10, "ac": 10, "other": 10 },
            { "house_id": "House 3", "lights": 10, "fans": 10, "fridge": 10, "tv": 10, "washing_machine": 10, "ac": 10, "other": 10 },
            { "house_id": "House 4", "lights": 10, "fans": 10, "fridge": 10, "tv": 10, "washing_machine": 10, "ac": 10, "other": 10 },
            { "house_id": "House 5", "lights": 10, "fans": 10, "fridge": 10, "tv": 10, "washing_machine": 10, "ac": 10, "other": 10 },
        ]
        
        response = main.analyze_houses(houses_data)
        
        # Verify result contains the expected fields
        self.assertIn("sync_id", response)
        self.assertEqual(response["s3_bucket"], "vidyut-rajeev-bmsit-demo")
        self.assertTrue(response["s3_url"].startswith("https://vidyut-rajeev-bmsit-demo.s3.ap-south-1.amazonaws.com/"))
        
        # Verify that put_object was called to upload the report to S3
        mock_s3_client.put_object.assert_called_once()
        call_kwargs = mock_s3_client.put_object.call_args[1]
        self.assertEqual(call_kwargs["Bucket"], "vidyut-rajeev-bmsit-demo")
        self.assertEqual(call_kwargs["ContentType"], "application/json")

    def test_load_all_records_retrieval(self):
        records = main.load_all_records()
        
        # Verify list_objects_v2 and get_object were called
        mock_s3_client.list_objects_v2.assert_called_once_with(
            Bucket="vidyut-rajeev-bmsit-demo", 
            Prefix="house-usage-analysis/"
        )
        mock_s3_client.get_object.assert_called_once_with(
            Bucket="vidyut-rajeev-bmsit-demo",
            Key="house-usage-analysis/test_record.json"
        )
        
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]["sync_id"], "test_record")

    def test_create_s3_bucket_endpoint(self):
        response = main.create_s3_bucket()
        self.assertTrue(response["created"])
        self.assertEqual(response["bucket"], "vidyut-rajeev-bmsit-demo")


if __name__ == "__main__":
    unittest.main()
