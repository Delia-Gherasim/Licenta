import os
from fastapi import APIRouter, HTTPException, Depends
from Service.VotesService import VotesService
from Model.VotesPydanctic import VoteRequest, VoteDeleteRequest, CommentIdRequest
from AuthorizationUtils import get_current_user

router = APIRouter()
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS")
votes_service = VotesService(FIREBASE_CREDENTIALS_PATH)

@router.get("/{commentId}")
async def get_votes_for_comment(commentId: str, user=Depends(get_current_user)):
    try:
        return await votes_service.get_votes_for_comment(commentId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{commentId}/total")
async def get_total_votes_for_comment(commentId: str, user=Depends(get_current_user)):
    try:
        return await votes_service.get_total_votes_for_comment(commentId)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{commentId}/user")
async def get_user_vote_for_comment(commentId: str, user=Depends(get_current_user)):
    try:
        return await votes_service.get_user_vote_for_comment(commentId, user["uid"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/vote")
async def vote_on_comment(request: VoteRequest, user=Depends(get_current_user)):
    try:
        user_id = user["uid"]
        return await votes_service.vote_on_comment(str(request.commentId), user_id, request.vote)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/remove")
async def remove_vote(request: VoteDeleteRequest, user=Depends(get_current_user)):
    try:
        user_id = user["uid"]
        if str(request.userId) != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized to remove this vote")
        return await votes_service.remove_vote(str(request.commentId), user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/remove_all")
async def remove_all_votes(request: CommentIdRequest, user=Depends(get_current_user)):
    try:
        # Optional: check for admin role here
        return await votes_service.remove_all_votes(str(request.commentId))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
