import asyncio
import logging
from typing import Callable, Any
from Repository.RatingsRepository import RatingsRepository
from Repository.PostsRepository import PostsRepository
from Repository.UsersRepository import UsersRepository

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("RatingService")

class RatingService:
    def __init__(self, cred_path: str):
        self.ratings_repo = RatingsRepository(cred_path)
        self.posts_repo = PostsRepository(cred_path)
        self.users_repo = UsersRepository(cred_path)

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

    async def _validate_post_and_user(self, post_id: str, user_id: str):
        post_valid, user_valid = await asyncio.gather(
            self.posts_repo.get_single_post(post_id), self.users_repo.get_user_by_id(user_id)
        )
        if not post_valid:
            return {"error": "Invalid post ID"}
        if not user_valid:
            return {"error": "Invalid user ID"}
        return None

    async def rate_post(self, post_id: str, user_id: str, rating: float):
        if not all([post_id, user_id, rating is not None]):
            logger.error("Missing required fields for rating post")
            return {"error": "Missing required fields"}

        validation_error = await self._validate_post_and_user(post_id, user_id)
        if validation_error:
            return validation_error

        logger.info(f"User {user_id} rating post {post_id} with {rating}")
        rating_result = await self.retry(self.ratings_repo.upload_or_update_rating, post_id, user_id, rating)

        if "error" in rating_result:
            return rating_result

        post_data = await self.posts_repo.get_single_post(post_id)
        if "userId" not in post_data:
            return {"error": "Post has no associated user"}

        newRating = await self.ratings_repo.get_post_average_rating(post_id)
        newUserRating = await self.posts_repo.get_user_average_rating(post_data["userId"])
        await asyncio.gather(
            self.posts_repo.update_post_rating(post_id, newRating),
            self.users_repo.update_user_rating(post_data["userId"], newUserRating)
        )

        return {"message": "Rating processed successfully"}

    async def get_ratings_for_post(self, post_id: str):
        if not post_id or not await self.posts_repo.get_single_post(post_id):
            logger.error(f"Invalid or missing post ID {post_id}")
            return {"error": "Invalid post ID"}

        logger.info(f"Fetching ratings for post {post_id}")
        return await self.retry(self.ratings_repo.get_post_ratings, post_id)

    async def get_average_rating_for_post(self, post_id: str):
        if not post_id or not await self.posts_repo.get_single_post(post_id):
            logger.error(f"Invalid or missing post ID {post_id}")
            return {"error": "Invalid post ID"}

        logger.info(f"Calculating average rating for post {post_id}")
        return await self.retry(self.ratings_repo.get_post_average_rating, post_id)

    async def get_user_rating_for_post(self, post_id: str, user_id: str):
        if not all([post_id, user_id]):
            logger.error("Post ID and User ID are required to get user rating")
            return {"error": "Post ID and User ID are required"}

        validation_error = await self._validate_post_and_user(post_id, user_id)
        if validation_error:
            return validation_error

        logger.info(f"Fetching rating for post {post_id} by user {user_id}")
        return await self.retry(self.ratings_repo.get_rating, post_id, user_id)

    async def remove_rating(self, post_id: str, user_id: str):
        if not all([post_id, user_id]):
            logger.error("Post ID and User ID are required to remove rating")
            return {"error": "Post ID and User ID are required"}

        validation_error = await self._validate_post_and_user(post_id, user_id)
        if validation_error:
            return validation_error

        rating_exists = await self.ratings_repo.get_rating(post_id, user_id)
        if not rating_exists:
            logger.warning(f"No rating found for post {post_id} by user {user_id}")
            return {"error": "No rating found"}

        logger.info(f"Removing rating for post {post_id} by user {user_id}")
        await self.retry(self.ratings_repo.delete_rating, post_id, user_id)

        post_data = await self.posts_repo.get_single_post(post_id)
        newRating = await self.ratings_repo.get_post_average_rating(post_id)
        newUserRating = await self.posts_repo.get_user_average_rating(post_data["userId"])
        await asyncio.gather(
            self.posts_repo.update_post_rating(post_id, newRating),
            self.users_repo.update_user_rating(post_data["userId"], newUserRating)
        )

        return {"message": "Rating removed successfully"}

    async def remove_all_ratings_for_post(self, post_id: str):
        if not post_id or not await self.posts_repo.get_single_post(post_id):
            logger.error(f"Invalid or missing post ID {post_id}")
            return {"error": "Invalid post ID"}

        existing_ratings = await self.ratings_repo.get_post_ratings(post_id)
        if not existing_ratings:
            logger.warning(f"No ratings to remove for post {post_id}")
            return {"error": "No ratings found"}

        logger.info(f"Removing all ratings for post {post_id}")
        await self.retry(self.ratings_repo.delete_all_ratings, post_id)

        post_data = await self.posts_repo.get_single_post(post_id)
        newUserRating = await self.posts_repo.get_user_average_rating(post_data["userId"])
        await self.users_repo.update_user_rating(post_data["userId"], newUserRating)

        return {"message": "All ratings removed successfully"}
