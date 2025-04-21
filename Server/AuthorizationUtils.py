import os
from fastapi import Header, HTTPException, Depends
import firebase_admin
from firebase_admin import auth
from firebase_admin import credentials
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS")

if not firebase_admin._apps:
    cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred)

async def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format")

    token = authorization.split(" ")[1]

    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token  
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
