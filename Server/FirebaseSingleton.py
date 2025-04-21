import firebase_admin
from firebase_admin import credentials, firestore


class FirebaseSingleton:
    _instance = None
    def __new__(cls, cred_path: str):
        if not cls._instance:
            cls._instance = super(FirebaseSingleton, cls).__new__(cls)
            if cred_path:  
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            cls._instance.db = firestore.client()  
        return cls._instance

    def get_firestore_client(self):
        return self.db
