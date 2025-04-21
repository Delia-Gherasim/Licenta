import asyncio
import logging
from typing import Callable, Any
from Model.Post import Post
from Repository.PostsRepository import PostsRepository
from Repository.CommentsRepository import CommentsRepository
from Repository.RatingsRepository import RatingsRepository
from Repository.VotesRepository import VotesRepository
from Repository.UsersRepository import UsersRepository
from Model.User import User

logger = logging.getLogger("PostsService")
logging.basicConfig(level=logging.INFO)

class PostsService:
    def __init__(self, cred_path: str):
        self.repo = PostsRepository(cred_path)
        self.comments_repo = CommentsRepository(cred_path)
        self.ratings_repo = RatingsRepository(cred_path)
        self.votes_repo = VotesRepository(cred_path)
        self.user_repo = UsersRepository(cred_path)

    async def retry(self, func: Callable, *args, retries: int = 3, delay: float = 1.0, **kwargs) -> Any:
        for attempt in range(1, retries + 1):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                logger.warning(f"[Attempt {attempt}] Error during '{func.__name__}': {e}")
                if attempt == retries:
                    raise
                await asyncio.sleep(delay * attempt)

    async def _validate_user(self, user_id: str) -> bool:
        return user_id and await self.user_repo.get_user_by_id(user_id)

    async def _validate_post(self, post_id: str) -> bool:
        return post_id and await self.repo.get_single_post(post_id)

    async def get_all_posts_of_user(self, user_id: str):
        if not await self._validate_user(user_id):
            return {"error": "Invalid user ID"}
        return await self.retry(self.repo.get_user_posts_from_firestore, user_id)
    
    async def get_user_by_post(self, post_id: str):
        if not post_id:
            return {"error": "Post ID is required"}

        id = await self.repo.get_user_by_post(post_id)  
        return await self.retry(self.user_repo.get_user_by_id, id)

    async def get_post_by_id(self, post_id: str):
        if not post_id:
            return {"error": "Post ID is required"}
        return await self.retry(self.repo.get_single_post, post_id)

    async def update_post(self, user_id: str, post: Post):
        if not await self._validate_user(user_id) or not post or not post.id:
            return {"error": "Invalid user or post data"}
        return await self.retry(self.repo.update_post, user_id, post.id, post)
    
    async def update_post_views(self, post_id: str):
        if not await self._validate_post(post_id):
            return {"error": "Invalid post ID"}
        return await self.retry(self.repo.update_post_views, post_id)
    
    async def add_post(self, post: Post):
        if not await self._validate_user(post.userId):
            return {"error": "Invalid user ID"}
        if not post or not post.id:
            return {"error": "Valid post object is required"}

        result = await self.retry(self.repo.upload_to_firestore, post)
        return result

    async def update_post_rating(self, post_id: str, new_rating: float):
        if not await self._validate_post(post_id):
            return {"error": "Invalid post ID"}

        print("in service")
        post_data = await self.repo.get_single_post(post_id)
        
        try:
            await self.ratings_repo.upload_or_update_rating(post_id, post_data.get('userId'), new_rating)
        except Exception as e:
            logger.error(f"Error updating rating for post {post_id}: {e}")
            return {"error": f"Error updating rating: {str(e)}"}

        newRating = await self.ratings_repo.get_post_average_rating(post_id)

        if isinstance(newRating, dict) and 'averageRating' in newRating:
            newRating = newRating['averageRating']
        elif isinstance(newRating, dict):
            logger.warning(f"Expected 'averageRating' in the dictionary, but got {newRating}")
            newRating = 0.0  
        elif not isinstance(newRating, float):
            logger.error(f"Unexpected type for newRating: {type(newRating)}")
            return {"error": "Invalid rating data"}

        print(f"newRating: {newRating} (type: {type(newRating)})")
        
        try:
            await self.repo.update_post_rating(post_id, newRating)
        except Exception as e:
            logger.error(f"Error updating post rating for post {post_id}: {e}")
            return {"error": f"Error updating post rating: {str(e)}"}

        try:
            newUserRating = await self.repo.get_user_average_rating(post_data.get('userId'))
            if isinstance(newUserRating, dict) and 'averageRating' in newUserRating:
                newUserRating = newUserRating['averageRating']
            
            print(f"newUserRating: {newUserRating} (type: {type(newUserRating)})")
            await self.user_repo.update_user_rating(post_data.get('userId'), newUserRating)
        except Exception as e:
            logger.error(f"Error updating user rating for user {post_data.get('userId')}: {e}")
            return {"error": f"Error updating user rating: {str(e)}"}

        print("dupa call repo")
        return {"message": "Post rating updated"}

    async def delete_post(self, user_id: str, post_id: str):
        if not await self._validate_user(user_id) or not await self._validate_post(post_id):
            return {"error": "Invalid user or post ID"}
        post_data = await self.repo.get_single_post(post_id)
        post_rating = post_data.get('rating', 0)

        tasks = [
            self.retry(self.ratings_repo.delete_all_ratings, post_id),
            self.retry(self.comments_repo.delete_post_and_comments, post_id),
            self.retry(self.votes_repo.delete_all_votes, post_id),
            self.retry(self.repo.delete_post, user_id, post_id)
        ]
        
        await asyncio.gather(*tasks)
        newUserRating = await self.repo.get_user_average_rating(post_data.get('userId'))
        await self.user_repo.update_user_rating(post_data.get('userId'), newUserRating)

        return {"message": "Post and related data deleted"}

    async def delete_all_posts_of_user(self, user_id: str):
        if not await self._validate_user(user_id):
            return {"error": "Invalid user ID"}

        posts = await self.retry(self.repo.get_user_posts_from_firestore, user_id)
        if "posts" not in posts:
            return {"error": "No posts found"}
        posts_list = posts["posts"]
        tasks = [self.delete_post(user_id, post["postId"]) for post in posts_list]
        await asyncio.gather(*tasks)

        self.user_repo.update_user_rating(user_id, 0)
        return {"message": "All posts deleted"}
    
    