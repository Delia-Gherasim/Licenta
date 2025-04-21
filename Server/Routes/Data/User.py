import os
from fastapi import APIRouter, HTTPException
from Service.UsersService import UsersService
from Model.User import User  
from Model.UserPydantic import UserPydantic

router = APIRouter()
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS")
users_service = UsersService(FIREBASE_CREDENTIALS_PATH)

def pydantic_to_user(user_schema: UserPydantic) -> User:
    return User(
        id=user_schema.id,
        name=user_schema.name,
        email=user_schema.email,
        bio=user_schema.bio,
        postRatings=user_schema.postRatings,
        commentsLikes=user_schema.commentsLikes,
        followers=user_schema.followers,
        following=user_schema.following
    )

@router.get("/")
async def get_all_users():
    users = await users_service.get_all_users()
    return users


@router.get("/{user_id}")
async def get_user(user_id: str):
    user_data = await users_service.get_user_by_id(user_id)
    if user_data.get("error"):
        raise HTTPException(status_code=404, detail=user_data["error"])
    return user_data


@router.put("/{user_id}")
async def update_user(user_id: str, user: UserPydantic):
    user_obj = pydantic_to_user(user)
    user_data = await users_service.update_user(user_id, user_obj)
    if user_data.get("error"):
        raise HTTPException(status_code=404, detail=user_data["error"])
    return user_data

@router.delete("/{user_id}")
async def delete_user(user_id: str):
    delete_data = await users_service.delete_user(user_id)
    if delete_data.get("error"):
        raise HTTPException(status_code=404, detail=delete_data["error"])
    return delete_data

@router.post("/{user_id}/follow/{target_user_id}")
async def follow_user(user_id: str, target_user_id: str):
    follow_data = await users_service.follow_user(user_id, target_user_id)
    if follow_data.get("error"):
        raise HTTPException(status_code=404, detail=follow_data["error"])
    return follow_data


@router.post("/{user_id}/unfollow/{target_user_id}")
async def unfollow_user(user_id: str, target_user_id: str):
    unfollow_data = await users_service.unfollow_user(user_id, target_user_id)
    if unfollow_data.get("error"):
        raise HTTPException(status_code=404, detail=unfollow_data["error"])
    return unfollow_data


@router.post("/{user_id}/add_follower/{follower_user_id}")
async def add_follower(user_id: str, follower_user_id: str):
    follow_data = await users_service.add_follower(user_id, follower_user_id)
    if follow_data.get("error"):
        raise HTTPException(status_code=404, detail=follow_data["error"])
    return follow_data


@router.post("/{user_id}/remove_follower/{follower_user_id}")
async def remove_follower(user_id: str, follower_user_id: str):
    remove_data = await users_service.remove_follower(user_id, follower_user_id)
    if remove_data.get("error"):
        raise HTTPException(status_code=404, detail=remove_data["error"])
    return remove_data



