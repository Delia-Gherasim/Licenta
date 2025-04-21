import os
from typing import List
from Service.CommentsService import CommentsService
from Model.CommentPydantic import CommentPydantic
from fastapi import APIRouter, HTTPException

router = APIRouter()
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS")
comments_service = CommentsService(FIREBASE_CREDENTIALS_PATH)

@router.post("/")
async def create_comment(comment: CommentPydantic):
    try:
        return await comments_service.create_comment(
            postId=str(comment.postId),
            userId=str(comment.userId),
            text=comment.text,
            parentId=str(comment.parentId) if comment.parentId else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/{commentId}")
async def get_comment_by_id(commentId: str):
    try:
        return await comments_service.get_single_comment(commentId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{commentId}")
async def update_comment(commentId: str, updated: CommentPydantic):
    try:
        return await comments_service.update_comment(
            commentId=commentId,
            text=updated.text,
            likes=updated.likes,
            parentId=str(updated.parentId) if updated.parentId else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.delete("/{commentId}")
async def delete_comment(commentId: str):
    try:
        return await comments_service.delete_comment(commentId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/post/{postId}")
async def get_comments_by_post_id(postId: str):
    try:
        return await comments_service.get_post_comments(postId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.delete("/post/{postId}")
async def delete_post_and_comments(postId: str):
    try:
        return await comments_service.delete_post_and_comments(postId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/post/{postId}/comment/{commentId}")
async def get_comment_tree(postId: str, commentId: str):
    try:
        return await comments_service.get_comment_tree(postId, commentId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/{userId}")
async def get_user_comments(userId: str):
    try:
        return await comments_service.get_user_comments(userId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
     


