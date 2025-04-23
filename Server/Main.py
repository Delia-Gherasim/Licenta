import os
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from Routes.Chatbot import Chatbot
from Routes.Data import Comment, Post, User, Rating, Votes

import tensorflow as tf
print(tf.__version__)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)
app.include_router(Chatbot.router, prefix="/chatbot", tags=["Chatbot"])

app.include_router(Post.router, prefix="/data/posts", tags=["Posts"])
app.include_router(Comment.router, prefix="/data/comments", tags=["Comments"])
app.include_router(User.router, prefix="/data/users", tags=["Users"])
app.include_router(Rating.router, prefix="/data/rating", tags=["Ratings"])
app.include_router(Votes.router, prefix="/data/votes", tags=["Votes"])
# conda activate licentaenv
# RUN WITH uvicorn Main:app --reload --host 127.0.0.1 --port 8000

