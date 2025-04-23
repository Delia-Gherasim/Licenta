from fastapi import FastAPI
from Routes.Data import Comment, Post, User
from Routes.Chatbot import  Chatbot
app = FastAPI()

app.include_router(Chatbot.router, prefix="/chatbot", tags=["Chatbot"])

app.include_router(Post.router, prefix="/data/posts", tags=["Posts"])
app.include_router(Comment.router, prefix="/data/comments", tags=["Comments"])
app.include_router(User.router, prefix="/data/users", tags=["Users"])

