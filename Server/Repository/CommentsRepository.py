from FirebaseSingleton import FirebaseSingleton
from Model import Comment
import asyncio
from fastapi.concurrency import run_in_threadpool
from google.cloud.firestore import Transaction

class CommentsRepository:
    def __init__(self, cred_path: str):
        self.firebase_instance = FirebaseSingleton(cred_path)
        self.db = self.firebase_instance.get_firestore_client()
        self.comments_collection = self.db.collection("comments")

    async def upload_comment_to_firestore(self, comment: Comment):
        comment_data = {
            "postId": comment.postId,
            "userId": comment.userId,
            "text": comment.text,
            "date": comment.date,
            "likes": comment.likes,
            "parentId": comment.parentId or None
        }
        comment_ref = self.comments_collection.document()
        await run_in_threadpool(comment_ref.set, comment_data)
        return {"message": "Comment uploaded", "commentId": comment_ref.id}

    async def get_post_comments_from_firestore(self, postId: str):
        def fetch_comments():
            return list(
                self.comments_collection
                .where("postId", "==", postId)
                .where("parentId", "==", None)
                .stream()
            )

        comments = await run_in_threadpool(fetch_comments)
        result = []

        async def process_comment(comment):
            data = comment.to_dict()
            data["commentId"] = comment.id
            replies = await run_in_threadpool(
                lambda: list(
                    self.comments_collection
                    .where("parentId", "==", comment.id)
                    .stream()
                )
            )
            data["hasReplies"] = bool(replies)
            result.append(data)

        await asyncio.gather(*(process_comment(c) for c in comments))
        return result

    async def get_single_comment(self, commentId: str):
        comment = await run_in_threadpool(lambda: self.comments_collection.document(commentId).get())
        if comment.exists:
            return {**comment.to_dict(), "commentId": comment.id}
        return {"error": "Comment not found"}

    async def update_comment(self, commentId: str, updated_comment: Comment):
        updates = {
            k: v for k, v in {
                "text": updated_comment.text,
                "likes": updated_comment.likes,
                "parentId": updated_comment.parentId
            }.items() if v is not None
        }

        if updates:
            await run_in_threadpool(lambda: self.comments_collection.document(commentId).update(updates))
            return {"message": "Comment updated"}
        return {"error": "No fields to update"}

    async def delete_comment(self, commentId: str):
        await run_in_threadpool(lambda: self.comments_collection.document(commentId).delete())
        return {"message": "Comment deleted"}

    async def delete_comments_and_replies(self, commentId: str):
        comment_ref = self.comments_collection.document(commentId)
        comment = await run_in_threadpool(comment_ref.get)
        if not comment.exists:
            return {"error": "Comment not found"}

        replies = await run_in_threadpool(
            lambda: list(self.comments_collection.where("parentId", "==", commentId).stream())
        )
        await run_in_threadpool(comment_ref.delete)
        await asyncio.gather(*[run_in_threadpool(r.reference.delete) for r in replies])
        return {"message": "Comment and all replies deleted successfully"}

    async def delete_post_and_comments(self, postId: str):
        comments = await run_in_threadpool(
            lambda: list(self.comments_collection.where("postId", "==", postId).stream())
        )
        await asyncio.gather(*[run_in_threadpool(c.reference.delete) for c in comments])
        return {"message": f"Post {postId} and all comments deleted"}

    async def get_user_comments(self, userId: str):
        comments = await run_in_threadpool(
            lambda: list(self.comments_collection.where("userId", "==", userId).stream())
        )
        return [{**c.to_dict(), "commentId": c.id} for c in comments]

    async def get_comment_tree(self, postId: str, commentId: str):
        main_comment_ref = self.comments_collection.document(commentId)
        main_comment = await run_in_threadpool(main_comment_ref.get)
        if not main_comment.exists:
            return {"error": "Main comment not found"}

        replies = await run_in_threadpool(
            lambda: list(self.comments_collection.where("parentId", "==", commentId).where("postId", "==", postId).stream())
        )

        return {
            "mainComment": {**main_comment.to_dict(), "commentId": main_comment.id},
            "replies": [{**r.to_dict(), "commentId": r.id} for r in replies]
        }

    async def get_comment_votes(self, commentId: str):
        comment = await run_in_threadpool(lambda: self.comments_collection.document(commentId).get())
        if not comment.exists:
            return {"error": "Comment not found"}
        return {"commentId": commentId, "likes": comment.to_dict().get("likes", 0)}

    async def update_comment_votes(self, commentId: str, vote: bool):
        def update_in_transaction(transaction: Transaction):
            ref = self.comments_collection.document(commentId)
            snapshot = ref.get(transaction=transaction)
            if not snapshot.exists:
                raise ValueError("Comment not found")

            current_likes = snapshot.to_dict().get("likes", 0)
            new_likes = current_likes + (1 if vote else -1)
            transaction.update(ref, {"likes": new_likes})
            return new_likes

        try:
            new_likes = await run_in_threadpool(lambda: self.db.run_transaction(update_in_transaction))
            return {"message": "Comment votes updated", "likes": new_likes}
        except ValueError as e:
            return {"error": str(e)}
