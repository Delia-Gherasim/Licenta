import os
from typing import List
from Service.RatingService import RatingService
from fastapi import APIRouter, HTTPException

router = APIRouter()
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS")
rating_service = RatingService(FIREBASE_CREDENTIALS_PATH)   

@router.post("/{postId}/{userId}/{rating}")
async def rate_post(postId: str, userId: str, rating: float):
    try:
        return await rating_service.rate_post(postId, userId, rating)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/{postId}")
async def get_post_ratings(postId: str):
    try:
        return await rating_service.get_ratings_for_post(postId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/average/{postId}")
async def get_post_average_rating(postId: str):
    try:
        return await rating_service.get_average_rating_for_post(postId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/{postId}/{userId}")
async def get_user_rating(postId: str, userId: str):
    try:
        return await rating_service.get_user_rating_for_post(postId, userId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.delete("/{postId}/{userId}")
async def delete_rating(postId: str, userId: str):
    try:
        return await rating_service.remove_rating(postId, userId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.delete("/post/{postId}")
async def delete_all_ratings_for_post(postId: str):
    try:
        return await rating_service.remove_all_ratings_for_post(postId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
