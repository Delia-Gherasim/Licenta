import os
from fastapi import APIRouter, HTTPException
from Service.VotesService import VotesService
from Model.VotesPydanctic import VoteRequest, VoteDeleteRequest, CommentIdRequest

router = APIRouter()
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS")
votes_service = VotesService(FIREBASE_CREDENTIALS_PATH)

# Get votes for a comment, passing user_id as part of the URL
@router.get("/{commentId}/{userId}")
async def get_votes_for_comment(commentId: str, userId: str):
    try:
        return await votes_service.get_votes_for_comment(commentId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get total votes for a comment, passing user_id as part of the URL
@router.get("/{commentId}/{userId}/total")
async def get_total_votes_for_comment(commentId: str, userId: str):
    try:
        return await votes_service.get_total_votes_for_comment(commentId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get the user's vote for a comment, passing user_id as part of the URL
@router.get("/{commentId}/{userId}/user")
async def get_user_vote_for_comment(commentId: str, userId: str):
    try:
        return await votes_service.get_user_vote_for_comment(commentId, userId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Vote on a comment, passing user_id as part of the request body
@router.post("/vote/{userId}")
async def vote_on_comment(request: VoteRequest, userId: str):
    try:
        return await votes_service.vote_on_comment(str(request.commentId), userId, request.vote)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Remove a vote, passing user_id as part of the URL
@router.delete("/remove/{userId}")
async def remove_vote(request: VoteDeleteRequest, userId: str):
    try:
        return await votes_service.remove_vote(str(request.commentId), userId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Remove all votes, passing user_id as part of the URL (optional admin check can be added)
@router.delete("/remove_all/{userId}")
async def remove_all_votes(request: CommentIdRequest, userId: str):
    try:
        # Optional: Check for admin role here if you want to restrict this action
        return await votes_service.remove_all_votes(str(request.commentId))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
