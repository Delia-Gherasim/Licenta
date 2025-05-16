import asyncio
import logging
from typing import Callable, Any
from Repository.UsersRepository import UsersRepository
from Repository.RatingsRepository import RatingsRepository
from Repository.PostsRepository import PostsRepository
from Repository.CommentsRepository import CommentsRepository
from Repository.VotesRepository import VotesRepository
from Model import User

logger = logging.getLogger("UsersService")
logging.basicConfig(level=logging.INFO)


class UsersService:
    def __init__(self, cred_path: str):
        self.users_repo = UsersRepository(cred_path)
        self.posts_repo = PostsRepository(cred_path)
        self.comments_repo = CommentsRepository(cred_path)
        self.ratings_repo = RatingsRepository(cred_path)
        self.votes_repo = VotesRepository(cred_path)

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

    async def _validate_user(self, user_id: str) -> bool:
        return user_id and await self.users_repo.get_user_by_id(user_id)

    async def update_user(self, user_id: str, user: User):
        if not await self._validate_user(user_id) or not user:
            return {"error": "Invalid user data"}
        return await self.retry(self.users_repo.update_user, user_id, user)

    async def _follow_helper(self, user_id: str, target_id: str, follow: bool):
        if not all(await asyncio.gather(self._validate_user(user_id), self._validate_user(target_id))):
            return {"error": "Invalid user IDs"}
        return await self.retry(self.users_repo.follow_update, user_id, target_id, follow)

    async def follow_user(self, user_id: str, target_user_id: str):
        return await self._follow_helper(user_id, target_user_id, True)

    async def unfollow_user(self, user_id: str, target_user_id: str):
        return await self._follow_helper(user_id, target_user_id, False)

    async def _follower_helper(self, user_id: str, follower_id: str, add: bool):
        if not all(await asyncio.gather(self._validate_user(user_id), self._validate_user(follower_id))):
            return {"error": "Invalid user IDs"}
        return await self.retry(self.users_repo.follower_update, user_id, follower_id, add)

    async def add_follower(self, user_id: str, follower_user_id: str):
        return await self._follower_helper(user_id, follower_user_id, True)

    async def remove_follower(self, user_id: str, follower_user_id: str):
        return await self._follower_helper(user_id, follower_user_id, False)

    async def get_user_by_id(self, user_id: str):
        if not user_id:
            return {"error": "User ID is required"}
        return await self.retry(self.users_repo.get_user_by_id, user_id)

    async def get_all_users(self):
        return await self.retry(self.users_repo.get_all_users)

    async def delete_user(self, user_id: str):
        if not await self._validate_user(user_id):
            return {"error": "Invalid user ID"}

        all_users = await self.retry(self.users_repo.get_all_users)  
        tasks = []
        for user in all_users:
            if user.get("userId") == user_id:  
                continue
            if user.get("following") and user_id in user["following"]:
                tasks.append(self.unfollow_user(user_id, user["userId"]))
            if user.get("followers") and user_id in user["followers"]:
                tasks.append(self.remove_follower(user_id, user["userId"]))


        posts = await self.retry(self.posts_repo.get_user_posts_from_firestore, user_id)
        for post in posts.get("posts", []):
            post_id = post.get("postId")
            if post_id:
                tasks.append(self._delete_post_data(user_id, post_id))

        await asyncio.gather(*tasks)

        await self.retry(self.users_repo.delete_user, user_id)
        return {"status": "User and related data deleted successfully"}

    async def _delete_post_data(self, user_id: str, post_id: str):
        comment_tasks = []
        comments = await self.retry(self.comments_repo.get_post_comments_from_firestore, post_id)
        for comment in comments or []:
            cid = comment.get("commentId")
            if cid:
                comment_tasks.extend([
                    self.retry(self.comments_repo.delete_comments_and_replies, cid),
                    self.retry(self.votes_repo.delete_all_votes, cid)
                ])

        await asyncio.gather(
            *comment_tasks,
            self.retry(self.ratings_repo.delete_all_ratings, post_id),
            self.retry(self.votes_repo.delete_all_votes, post_id),
            self.retry(self.posts_repo.delete_post, user_id, post_id)
        )
        return {"status": f"Post {post_id} and related data deleted successfully"}