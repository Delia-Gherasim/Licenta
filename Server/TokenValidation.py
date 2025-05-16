import os
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from FirebaseSingleton import FirebaseSingleton
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS")


def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        firebase_instance = FirebaseSingleton(FIREBASE_CREDENTIALS_PATH)
        decoded_token = auth.verify_id_token(token)
        return decoded_token  
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed"
        )
