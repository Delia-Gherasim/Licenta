import os
from fastapi import APIRouter, HTTPException
from Service.VotesService import VotesService
from Model.VotesPydanctic import VoteDeleteRequest, VoteRequest, CommentIdRequest
import logging

router = APIRouter()
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS")
votes_service = VotesService(FIREBASE_CREDENTIALS_PATH)

@router.get("/{commentId}")
async def get_votes_for_comment(commentId: str, userId: str):
    try:
        return await votes_service.get_votes_for_comment(commentId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{commentId}/total")
async def get_total_votes_for_comment(commentId: str, userId: str):
    try:
        return await votes_service.get_total_votes_for_comment(commentId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{commentId}/user/{userId}")
async def get_user_vote_for_comment(commentId: str, userId: str):
    try:
        return await votes_service.get_user_vote_for_comment(commentId, userId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/vote")
async def vote_on_comment(request: VoteRequest):
    try:
        comment_id = str(request.commentId)
        user_id = str(request.userId)
        vote = request.vote
        return await votes_service.vote_on_comment(comment_id, user_id, vote)
    except Exception as e:
        logging.exception(f"Error in vote_on_comment for comment {request.commentId}, user {request.userId}, vote {request.vote}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/remove")
async def remove_vote(request: VoteDeleteRequest):
    try:
        return await votes_service.remove_vote(str(request.commentId), str(request.userId))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/remove_all")
async def remove_all_votes(request: CommentIdRequest):
    try:
        return await votes_service.remove_all_votes(str(request.commentId))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
