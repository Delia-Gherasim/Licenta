import logging
import asyncio
from datetime import datetime
from typing import Callable, Any
import uuid

from Repository.CommentsRepository import CommentsRepository
from Repository.VotesRepository import VotesRepository
from Model.Comment import Comment
from Repository.PostsRepository import PostsRepository
from Repository.UsersRepository import UsersRepository

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CommentsService")

class CommentsService:
    def __init__(self, cred_path: str):
        self.comments_repo = CommentsRepository(cred_path)
        self.votes_repo = VotesRepository(cred_path)
        self.posts_repo = PostsRepository(cred_path)
        self.users_repo = UsersRepository(cred_path)

    async def retry(self, func: Callable, *args, retries: int = 3, delay: float = 1.0, **kwargs):
        for attempt in range(retries):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                logger.warning(f"[Retry {attempt + 1}] Error in {func.__name__}: {e}")
                if attempt + 1 == retries:
                    logger.error(f"Max retries reached for {func.__name__}")
                    raise
                await asyncio.sleep(delay * (attempt + 1))

    async def _validate_ids(self, postId=None, userId=None, commentId=None):
        if postId and not await self.posts_repo.get_single_post(postId):
            return f"Invalid post ID: {postId}"
        if userId and not await self.users_repo.get_user_by_id(userId):
            return f"Invalid user ID: {userId}"
        if commentId and not await self.comments_repo.get_single_comment(commentId):
            return f"Invalid comment ID: {commentId}"
        return None

    async def create_comment(self, postId, userId, text, parentId=None):
        if not all([postId, userId, text]):
            return {"error": "postId, userId, and text are required"}
        if error := await self._validate_ids(postId=postId, userId=userId):
            return {"error": error}

        comment = Comment(
            id=str(uuid.uuid4()),
            postId=postId,
            userId=userId,
            text=text,
            date=datetime.now().strftime('%Y-%m-%d'),
            likes=0,
            parentId=parentId
        )
        return await self.retry(self.comments_repo.upload_comment_to_firestore, comment)

    async def get_post_comments(self, postId):
        if not postId:
            return {"error": "Missing postId"}
        if error := await self._validate_ids(postId=postId):
            return {"error": error}
        return await self.retry(self.comments_repo.get_post_comments_from_firestore, postId)

    async def get_single_comment(self, commentId):
        if not commentId:
            return {"error": "Missing commentId"}
        if error := await self._validate_ids(commentId=commentId):
            return {"error": error}
        return await self.retry(self.comments_repo.get_single_comment, commentId)

    async def update_comment(self, commentId, text=None, likes=None, parentId=None):
        if not commentId:
            return {"error": "Missing commentId"}
        comment = await self.retry(self.comments_repo.get_single_comment, commentId)
        if not comment:
            return {"error": "Invalid comment ID"}

        updated_comment = Comment(
            id=commentId,
            postId=comment["postId"],
            userId=comment["userId"],
            text=text or comment["text"],
            date=comment["date"],
            likes=likes if likes is not None else comment["likes"],
            parentId=parentId or comment.get("parentId")
        )
        return await self.retry(self.comments_repo.update_comment, commentId, updated_comment)

    async def delete_comment(self, commentId):
        if not commentId:
            return {"error": "Missing commentId"}
        if error := await self._validate_ids(commentId=commentId):
            return {"error": error}
        return await self.retry(self.comments_repo.delete_comment, commentId)

    async def delete_comments_and_replies(self, commentId):
        if not commentId:
            return {"error": "Missing commentId"}
        if error := await self._validate_ids(commentId=commentId):
            return {"error": error}
        return await self.retry(self.comments_repo.delete_comments_and_replies, commentId)

    async def delete_post_and_comments(self, postId):
        if not postId:
            return {"error": "Missing postId"}
        if error := await self._validate_ids(postId=postId):
            return {"error": error}
        return await self.retry(self.comments_repo.delete_post_and_comments, postId)

    async def get_user_comments(self, userId):
        if not userId:
            return {"error": "Missing userId"}
        if error := await self._validate_ids(userId=userId):
            return {"error": error}
        return await self.retry(self.comments_repo.get_user_comments, userId)

    async def get_comment_tree(self, postId, commentId):
        if not postId or not commentId:
            return {"error": "Missing postId or commentId"}
        if error := await self._validate_ids(postId=postId, commentId=commentId):
            return {"error": error}
        return await self.retry(self.comments_repo.get_comment_tree, postId, commentId)

    async def delete_comment_replies_and_votes(self, commentId):
        if not commentId:
            return {"error": "Missing commentId"}
        
        comment = await self.retry(self.comments_repo.get_single_comment, commentId)
        if not comment:
            return {"error": "Invalid commentId"}
        
        tree = await self.retry(self.comments_repo.get_comment_tree, comment["postId"], commentId)
        ids_to_delete = [c.id for c in tree] + [commentId]

        await asyncio.gather(
            *[self.retry(self.votes_repo.delete_all_votes, cid) for cid in ids_to_delete],
            *[self.retry(self.comments_repo.delete_comments_and_replies, cid) for cid in ids_to_delete]
        )

        userId = comment["userId"]
        await self.update_user_total_likes(userId)
        
        return {"message": "Comment, replies, and votes deleted"}

    async def update_user_total_likes(self, userId):
        user_comments = await self.get_user_comments(userId)
        total_likes = 0
        for comment in user_comments:
            total_likes += comment.get("likes", 0)
                
        await self.users_repo.update_user_votes(userId, total_likes)
        return {"message": f"User's total likes updated to {total_likes}"}