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
            
            # Denoiser++: Clean up common copy-paste artifacts
            service_account_str = service_account_str.strip()
            
            # 1. Remove surrounding single quotes if present
            if service_account_str.startswith("'") and service_account_str.endswith("'"):
                service_account_str = service_account_str[1:-1]

            # 2. Fix unquoted keys (e.g., type: -> "type":)
            import re
            # Regex to find: word followed by colon, not preceded by quote
            # This is a basic fix for unquoted keys often seen in manual attempts
            service_account_str = re.sub(r'(?<!")(\b\w+\b)(?=:)', r'"\1"', service_account_str)

            # Parse the JSON string
            try:
                service_account_info = json.loads(service_account_str)
            except json.JSONDecodeError as json_err:
                # Print first 50 characters for debugging
                snippet = service_account_str[:50]
                logger.error(f"Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: {json_err}")
                logger.error(f"First 50 chars: {snippet}")
                return None
                
            # Project ID Lock: Strict validation for gandharva-2026
            if service_account_info.get("project_id") != "gandharva-2026":
                msg = f"CRITICAL: Project ID mismatch! Expected 'gandharva-2026', got '{service_account_info.get('project_id')}'"
                logger.error(msg)
                raise ValueError(msg)
                
            cred = credentials.Certificate(service_account_info)
            firebase_admin.initialize_app(cred, {
                'storageBucket': os.getenv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET")
            })
            logger.info("Firebase Admin initialized successfully for gandharva-2026")
        except Exception as e:
            logger.error(f"Unexpected error during Firebase initialization: {e}")
            return None
    return firebase_admin.get_app()

# Initialize on import
app = initialize_firebase()
db = firestore.client() if app else None
bucket = storage.bucket() if app else None
