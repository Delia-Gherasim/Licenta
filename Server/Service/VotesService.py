import asyncio
import logging
from typing import Callable, Any
from Repository.VotesRepository import VotesRepository
from Repository.UsersRepository import UsersRepository
from Repository.RatingsRepository import RatingsRepository
from Repository.PostsRepository import PostsRepository
from Repository.CommentsRepository import CommentsRepository
from Model.Comment import Comment

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("VotesService")


class VotesService:
    def __init__(self, cred_path: str):
        self.votes_repo = VotesRepository(cred_path)
        self.comments_repo = CommentsRepository(cred_path)
        self.users_repo = UsersRepository(cred_path)
        self.posts_repo = PostsRepository(cred_path)

    async def retry(self, func: Callable, *args, retries: int = 3, delay: float = 1.0, **kwargs) -> Any:
        for attempt in range(1, retries + 1):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                logger.warning(f"[Attempt {attempt}] Error during '{func.__name__}': {e}")
                if attempt == retries:
                    logger.error(f"Max retries reached for '{func.__name__}' with args {args}")
                    raise
                await asyncio.sleep(delay * attempt)

    async def _validate_comment(self, comment_id: str) -> bool:
        return comment_id and await self.comments_repo.get_single_comment(comment_id)

    async def _validate_user(self, user_id: str) -> bool:
        return user_id and await self.users_repo.get_user_by_id(user_id)

    async def get_votes_for_comment(self, comment_id: str):
        if not await self._validate_comment(comment_id):
            logger.error(f"Invalid comment ID {comment_id}")
            raise ValueError("Invalid comment ID")

        logger.info(f"Fetching votes for comment {comment_id}")
        return await self.retry(self.votes_repo.get_comment_votes, comment_id)

    async def get_total_votes_for_comment(self, comment_id: str):
        if not await self._validate_comment(comment_id):
            logger.error(f"Invalid comment ID {comment_id}")
            raise ValueError("Invalid comment ID")

        logger.info(f"Fetching total votes for comment {comment_id}")
        return await self.retry(self.votes_repo.get_comment_total_votes, comment_id)


    async def remove_all_votes(self, comment_id: str):
        if not await self._validate_comment(comment_id):
            logger.error(f"Invalid comment ID {comment_id}")
            raise ValueError("Invalid comment ID")

        logger.info(f"Removing all votes for comment {comment_id}")
        return await self.retry(self.votes_repo.delete_all_votes, comment_id)

    async def get_user_vote_for_comment(self, comment_id: str, user_id: str):
        if not await self._validate_comment(comment_id):
            logger.error(f"Invalid comment ID {comment_id}")
            raise ValueError("Invalid comment ID")
        if not await self._validate_user(user_id):
            logger.error(f"Invalid user ID {user_id}")
            raise ValueError("Invalid user ID")

        logger.info(f"Fetching user {user_id}'s vote for comment {comment_id}")
        return await self.retry(self.votes_repo.get_user_vote, comment_id, user_id)
    
    async def vote_on_comment(self, comment_id: str, user_id: str, vote: bool):
        valid_comment, valid_user = await asyncio.gather(
            self._validate_comment(comment_id), self._validate_user(user_id)
        )

        if not valid_comment:
            logger.error(f"Invalid comment ID {comment_id}")
            raise ValueError("Invalid comment ID")
        if not valid_user:
            logger.error(f"Invalid user ID {user_id}")
            raise ValueError("Invalid user ID")

        logger.info(f"User {user_id} voting on comment {comment_id} with vote: {vote}")
        await self.retry(self.votes_repo.upload_or_update_vote, comment_id, user_id, vote)
        await self.retry(self.comments_repo.update_comment_votes, comment_id, vote)
        total_votes, comment = await asyncio.gather(
            self.retry(self.votes_repo.get_comment_total_votes, comment_id),
            self.comments_repo.get_single_comment(comment_id),
        )
        await self.update_user_total_likes(comment["userId"])

        return {"message": "Vote processed", "totalLikes": total_votes}

    async def remove_vote(self, comment_id: str, user_id: str):
        if not await self._validate_comment(comment_id):
            logger.error(f"Invalid comment ID {comment_id}")
            raise ValueError("Invalid comment ID")
        if not await self._validate_user(user_id):
            logger.error(f"Invalid user ID {user_id}")
            raise ValueError("Invalid user ID")

        logger.info(f"Removing vote of user {user_id} for comment {comment_id}")
        previous_vote = await self.retry(self.votes_repo.get_user_vote, comment_id, user_id)
        await self.retry(self.votes_repo.delete_vote, comment_id, user_id)
        if previous_vote is not None:
            await self.retry(self.comments_repo.update_comment_votes, comment_id, not previous_vote)
        total_votes, comment = await asyncio.gather(
            self.retry(self.votes_repo.get_comment_total_votes, comment_id),
            self.comments_repo.get_single_comment(comment_id),
        )

        await self.update_user_total_likes(comment["userId"])

        return {"message": "Vote removed", "totalLikes": total_votes}

    async def update_user_total_likes(self, user_id: str):
        user_comments = await self.comments_repo.get_user_comments(user_id)
        total_likes = sum(comment.get("likes", 0) for comment in user_comments)
        user_posts_data = await self.posts_repo.get_user_posts_from_firestore(user_id)
        user_posts = user_posts_data.get("posts", [])
        total_likes += sum(post.get("likes", 0) for post in user_posts)
        await self.users_repo.update_user_likes(user_id, total_likes)

        return total_likes
