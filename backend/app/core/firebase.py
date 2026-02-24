import os
import json
import firebase_admin
from firebase_admin import credentials, firestore, storage
from loguru import logger

def initialize_firebase():
    """
    Initializes Firebase Admin SDK using FIREBASE_SERVICE_ACCOUNT_JSON env var.
    Includes hot-reload protection and JSON string parsing.
    """
    if not firebase_admin._apps:
        try:
            service_account_str = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
            if not service_account_str:
                logger.warning("FIREBASE_SERVICE_ACCOUNT_JSON not found in environment")
                return None
            
            # Parse the JSON string as requested
            service_account_info = json.loads(service_account_str)
            cred = credentials.Certificate(service_account_info)
            firebase_admin.initialize_app(cred, {
                'storageBucket': os.getenv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET")
            })
            logger.info("Firebase Admin initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase Admin: {e}")
            return None
    return firebase_admin.get_app()

# Initialize on import
app = initialize_firebase()
db = firestore.client() if app else None
bucket = storage.bucket() if app else None
