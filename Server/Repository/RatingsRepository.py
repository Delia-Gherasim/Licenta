import asyncio
from FirebaseSingleton import FirebaseSingleton
from fastapi.concurrency import run_in_threadpool
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("RatingsRepository")

class RatingsRepository:
    def __init__(self, cred_path: str):
        self.firebase_instance = FirebaseSingleton(cred_path)
        self.db = self.firebase_instance.get_firestore_client()
        self.collection_name = "ratings"

    async def _get_rating_document(self, pId: str, uId: str):
        doc_id = f"{pId}_{uId}"
        rating_ref = self.db.collection(self.collection_name).document(doc_id)
        return await run_in_threadpool(rating_ref.get)

    async def calculate_average_rating(self, pId: str):
        try:
            ratings_ref = self.db.collection(self.collection_name).where("postId", "==", pId)
            ratings = await run_in_threadpool(lambda: list(ratings_ref.stream()))

            if not ratings:
                return 0.0 

            total_rating = 0
            valid_ratings_count = 0
            
            for r in ratings:
                rating = r.to_dict().get("rating")
                if isinstance(rating, (int, float)): 
                    total_rating += rating
                    valid_ratings_count += 1
                else:
                    logger.warning(f"Invalid rating value: {rating} in rating document {r.id} for post {pId}")
            
            if valid_ratings_count == 0:
                return 0.0 
            
            return total_rating / valid_ratings_count 
        except Exception as e:
            logger.error(f"Error calculating average rating for post {pId}: {e}")
            return 0.0  

    async def upload_or_update_rating(self, pId: str, uId: str, rating: float):
        if not (1 <= rating <= 5):
            return {"error": "Rating must be between 1 and 5"}

        try:
            doc = await self._get_rating_document(pId, uId)
            data = {"userId": uId, "postId": pId, "rating": rating}

            if doc.exists:
                old_rating = doc.to_dict().get("rating")
                await run_in_threadpool(doc.reference.update, {"rating": rating})
                return {"message": "Rating updated", "oldRating": old_rating, "isNew": False}
            else:
                await run_in_threadpool(doc.reference.set, data)
                return {"message": "Rating created", "isNew": True}

        except Exception as e:
            logger.error(f"Error uploading or updating rating: {e}")
            return {"error": "Failed to upload or update rating"}

    async def get_post_ratings(self, pId: str):
        try:
            ratings_ref = self.db.collection(self.collection_name).where("postId", "==", pId)
            ratings = await run_in_threadpool(lambda: list(ratings_ref.stream()))

            return [{"ratingId": r.id, **r.to_dict()} for r in ratings]
        except Exception as e:
            logger.error(f"Error retrieving ratings for post {pId}: {e}")
            return {"error": "Failed to retrieve ratings"}

    async def get_post_average_rating(self, pId: str):
        try:
            avg = await self.calculate_average_rating(pId)
            return avg
        except Exception as e:
            logger.error(f"Error calculating average rating for post {pId}: {e}")
            return {"error": "Failed to calculate average rating"}

    async def delete_rating(self, pId: str, uId: str):
        try:
            doc = await self._get_rating_document(pId, uId)

            if doc.exists:
                await run_in_threadpool(doc.reference.delete)
                return {"message": "Rating deleted"}
            else:
                return {"error": "Rating not found"}
        except Exception as e:
            logger.error(f"Error deleting rating: {e}")
            return {"error": "Failed to delete rating"}

    async def delete_all_ratings(self, pId: str):
        try:
            ratings_ref = self.db.collection(self.collection_name).where("postId", "==", pId)
            ratings = await run_in_threadpool(lambda: list(ratings_ref.stream()))

            if not ratings:
                logger.warning(f"No ratings found for post {pId}")
                return {"message": f"No ratings found for post {pId}"}
            tasks = [run_in_threadpool(rating.reference.delete) for rating in ratings]
            await asyncio.gather(*tasks)

            logger.info(f"Successfully deleted all ratings for post {pId}")
            return {"message": f"All ratings for post {pId} deleted"}
        except Exception as e:
            logger.error(f"Error deleting all ratings for post {pId}: {e}")
            return {"error": "Failed to delete all ratings"}

    async def get_rating(self, pId: str, uId: str):
        try:
            doc = await self._get_rating_document(pId, uId)

            if doc.exists:
                return doc.to_dict().get("rating")
            else:
                return {"message": "Rating not found"}
        except Exception as e:
            logger.error(f"Error retrieving rating for post {pId} and user {uId}: {e}")
            return {"error": "Failed to retrieve rating"}
