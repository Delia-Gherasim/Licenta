from fastapi import FastAPI
from mongoDb import try_connection

app = FastAPI()

@app.get("/api")
def read_root():
    try_connection()
    return {"message": "Hello from FastAPI!"}