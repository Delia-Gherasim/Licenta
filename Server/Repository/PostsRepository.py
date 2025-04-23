from FirebaseSingleton import FirebaseSingleton
from Model.Post import Post
from google.cloud.firestore import SERVER_TIMESTAMP
from google.api_core.exceptions import InvalidArgument
import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("PostsREPO")

class PostsRepository:
    def __init__(self, cred_path: str):
        self.firebase_instance = FirebaseSingleton(cred_path)
        self.db = self.firebase_instance.get_firestore_client()
        self.posts_collection = self.db.collection("posts")
        self.users_collection = self.db.collection("users")
        self.ratings_collection = self.db.collection("ratings")
        self.comments_collection = self.db.collection("comments")

    async def _fetch_document(self, collection, doc_id: str):
        doc_ref = collection.document(doc_id)
        doc = await asyncio.to_thread(doc_ref.get)
        return doc

    async def upload_to_firestore(self, post: Post):
        post_data = {
            "userId": str(post.userId),
            "caption": post.caption,
            "date": post.date or SERVER_TIMESTAMP,
            "rating": post.rating,
            "url": post.url,
            "views": post.views,
            "hashtags": post.hashtags,
        }

        post_ref = self.posts_collection.document(str(post.id))
        await asyncio.to_thread(post_ref.set, post_data)

        return {"message": "Post uploaded", "postId": post.id, "url": post.url}

    async def get_user_posts_from_firestore(self, user_id: str):
        try:
            posts_query = self.posts_collection \
                .where("userId", "==", user_id) \
                .order_by("date", direction="DESCENDING")  

            posts = await asyncio.to_thread(lambda: list(posts_query.stream()))
            post_list = [{**p.to_dict(), "postId": p.id} for p in posts]

            return {
                "posts": post_list
            }

        except InvalidArgument as e:
            logger.error(f"Firestore query failed: {e}")
            return {
                "error": "Firestore index is missing. Please create the required composite index."
            }
     
    async def get_all_posts_from_firestore(self):
        try:
            posts_query = self.posts_collection \
                .order_by("rating", direction="DESCENDING") \
                .order_by("date", direction="DESCENDING")
            
            posts = await asyncio.to_thread(lambda: list(posts_query.stream()))

            post_list = [{**p.to_dict(), "postId": p.id} for p in posts]
            return {"posts": post_list}
        except InvalidArgument as e:
            logger.error(f"Firestore query failed: {e}")
            return {"error": "Firestore index is missing. Please create the required composite index."}

    async def get_single_post(self, postId: str):
        post = await self._fetch_document(self.posts_collection, postId)
        if post.exists:
            data = post.to_dict()
            data["postId"] = post.id
            return data
        return {"error": "Post not found"}

    async def get_user_by_post(self, postId: str):
        post = await self._fetch_document(self.posts_collection, postId)
        if post.exists:
            user_id = post.to_dict().get("userId")
            user = await self._fetch_document(self.users_collection, user_id)
            if user.exists:
                return user.id
            return {"error": "User not found"}
        return {"error": "Post not found"}

    async def update_post(self, user_id: str, postId: str, post: Post):
        existing = await self._fetch_document(self.posts_collection, postId)
        if not existing.exists:
            return {"error": "Post not found"}
        if existing.to_dict().get("userId") != user_id:
            return {"error": "Unauthorized to update this post"}

        updates = {}
        if post.caption: updates["caption"] = post.caption
        if post.date: updates["date"] = post.date
        if post.hashtags is not None: updates["hashtags"] = post.hashtags

        if updates:
            post_ref = self.posts_collection.document(postId)
            await asyncio.to_thread(post_ref.update, updates)
            return {"message": "Post updated"}
        return {"error": "No fields to update"}

    async def update_post_views(self, postId: str):
        post_ref = self.posts_collection.document(postId)
        existing = await asyncio.to_thread(post_ref.get)

        if not existing.exists:
            return {"error": "Post not found"}
        views = existing.to_dict().get("views", 0)
        if not isinstance(views, int):
            return {"error": "Invalid views data"}

        views += 1
        await asyncio.to_thread(post_ref.update, {"views": views})
        return {"message": "Views updated"}

    async def update_post_rating(self, postId: str, rating: float):
        post_ref = self.posts_collection.document(postId)
        existing = await asyncio.to_thread(post_ref.get)

        if not existing.exists:
            return {"error": "Post not found"}

        await asyncio.to_thread(post_ref.update, {"rating": rating})
        return {"message": "Rating updated"}

    async def delete_post(self, user_id: str, post_id: str):
        post_ref = self.posts_collection.document(post_id)
        post = await asyncio.to_thread(post_ref.get)

        if not post.exists:
            return {"error": "Post not found"}
        if post.to_dict().get("userId") != user_id:
            return {"error": "Unauthorized to delete this post"}

        batch = self.db.batch()
        ratings_ref = self.ratings_collection.where("postId", "==", post_id)
        comments_ref = self.comments_collection.where("postId", "==", post_id)

        ratings = await asyncio.to_thread(lambda: list(ratings_ref.stream()))
        comments = await asyncio.to_thread(lambda: list(comments_ref.stream()))

        for rating in ratings:
            batch.delete(rating.reference)
        for comment in comments:
            batch.delete(comment.reference)

        batch.delete(post_ref)
        await asyncio.to_thread(batch.commit)

        return {"message": "Post and related data deleted"}

    async def delete_all_posts_of_user(self, user_id: str):
        logger.info(f"Deleting all posts for user: {user_id}")
        
        posts_ref = self.posts_collection.where("userId", "==", user_id)
        posts = await asyncio.to_thread(lambda: list(posts_ref.stream()))
        
        batch = self.db.batch()
        
        for post in posts:
            post_ref = post.reference
            ratings_ref = self.ratings_collection.where("postId", "==", post_ref.id)
            comments_ref = self.comments_collection.where("postId", "==", post_ref.id)
            
            ratings = await asyncio.to_thread(lambda: list(ratings_ref.stream()))
            comments = await asyncio.to_thread(lambda: list(comments_ref.stream()))

            for rating in ratings:
                batch.delete(rating.reference)
            for comment in comments:
                batch.delete(comment.reference)

            batch.delete(post_ref)
        
        await asyncio.to_thread(batch.commit)
        logger.info(f"Deleted all posts for user: {user_id}")
        return {"message": f"All posts deleted for user ID: {user_id}"}

    async def get_user_average_rating(self, user_id: str):
        try:
            posts_ref = self.posts_collection.where("userId", "==", user_id)
            posts = await asyncio.to_thread(lambda: list(posts_ref.stream()))
            
            total_rating = 0.0
            total_posts = 0

            for post in posts:
                rating = post.to_dict().get("rating", 0.0)
                if isinstance(rating, (int, float)):
                    total_rating += rating
                    total_posts += 1
                else:
                    logger.warning(f"Invalid rating value in post: {rating}")
            
            if total_posts == 0:
                return {"error": "User has no posts"}  

            average_rating = total_rating / total_posts
            return average_rating  

        except InvalidArgument as e:
            logger.error(f"Firestore query failed: {e}")
            return {"error": "Error computing average rating"}

