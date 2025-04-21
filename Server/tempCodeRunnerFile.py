from fastapi import FastAPI
from Routes.Data import Comment, Post, User
from Routes.Ai import AiRoutes
app = FastAPI()

app.include_router(AiRoutes.router, prefix="/ai", tags=["AI"])

app.include_router(Post.router, prefix="/data/posts", tags=["Posts"])
app.include_router(Comment.router, prefix="/data/comments", tags=["Comments"])
app.include_router(User.router, prefix="/data/users", tags=["Users"])

