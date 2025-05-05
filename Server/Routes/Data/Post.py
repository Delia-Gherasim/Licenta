import os
from fastapi import APIRouter, HTTPException
from Model.PostPydantic import PostPydantic
from Service.PostsService import PostsService
import uuid

router = APIRouter()
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS")
post_service = PostsService(FIREBASE_CREDENTIALS_PATH)

@router.post("/")
async def create_post(post_data: PostPydantic):
    try:
        temp_id = str(uuid.uuid4())
        post = post_data.to_post(post_id=temp_id)
        return await post_service.add_post(post)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/")
async def get_all_posts():
    try:
        return await post_service.get_all_posts()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{postId}")
async def update_post(postId: str, post_data: PostPydantic):
    try:
        post = post_data.to_post(post_id=postId)
        return await post_service.update_post(user_id=str(post_data.user_id), post=post)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.put("/view/{postId}")
async def update_post_view(postId: str):
    try:
        return await post_service.update_post_views(postId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
@router.delete("/{postId}/{userId}")
async def delete_post(userId: str, postId: str):
    try:
        return await post_service.delete_post(user_id=userId, post_id=postId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{postId}")
async def get_post_by_id(postId: str):
    try:
        return await post_service.get_post_by_id(postId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
@router.get("/all/{userId}")
async def get_all_posts_of_user(userId: str):
    try:
        return await post_service.get_all_posts_of_user(userId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/all_friends/{userId}")
async def get_all_posts_for_user(userId: str):
    try:
        return await post_service.get_all_posts_for_user(userId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/user/{postId}")
async def get_user_by_post(postId: str):
    try:
        return await post_service.get_user_by_post(postId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.delete("/user/{userId}/delete")
async def delete_all_user_posts(userId: str):
    try:
        return await post_service.delete_all_posts_of_user(userId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
