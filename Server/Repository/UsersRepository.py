from FirebaseSingleton import FirebaseSingleton
from Model import User
from fastapi.concurrency import run_in_threadpool
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("UsersRepository")

class UsersRepository:
    def __init__(self, cred_path: str):
        self.firebase_instance = FirebaseSingleton(cred_path)
        self.db = self.firebase_instance.get_firestore_client()

    async def _get_user_doc(self, uId: str):
        user_ref = self.db.collection("users").document(uId)
        return await run_in_threadpool(user_ref.get)

    async def update_user(self, uId: str, user: User):
        user_doc = await self._get_user_doc(uId)

        if user_doc.exists:
            updates = {k: v for k, v in {
                "name": user.name,
                "email": user.email,
                "bio": user.bio
            }.items() if v is not None}

            if updates:
                await run_in_threadpool(user_doc.reference.update, updates)
                return {"message": "User updated"}
            else:
                return {"error": "No fields to update"}
        else:
            return {"error": "User not found"}

    async def _update_followers_or_following(self, uId: str, user_field: str, userId: str, status: bool):
        user_doc = await self._get_user_doc(uId)

        if user_doc.exists:
            all_users = await self.get_all_users()
            all_user_ids = {user["userId"] for user in all_users}

            if userId not in all_user_ids:
                return {"error": f"User '{userId}' does not exist"}
            user_list = user_doc.to_dict().get(user_field, [])

            if status:
                if userId not in user_list:
                    user_list.append(userId)
                    await run_in_threadpool(user_doc.reference.update, {user_field: user_list})
                    return {"message": f"Now {user_field[:-1]} {userId}"}
                else:
                    return {"message": f"Already {user_field[:-1]} {userId}"}
            else:
                if userId in user_list:
                    user_list.remove(userId)
                    await run_in_threadpool(user_doc.reference.update, {user_field: user_list})
                    return {"message": f"Un{user_field[:-1]} {userId}"}
                else:
                    return {"message": f"Not {user_field[:-1]} {userId}"}
        else:
            return {"error": "User not found"}

    async def follow_update(self, uId: str, followingUserId: str, status: bool):
        return await self._update_followers_or_following(uId, "following", followingUserId, status)

    async def follower_update(self, uId: str, followerUserId: str, status: bool):
        return await self._update_followers_or_following(uId, "followers", followerUserId, status)

    async def update_user_rating(self, uId: str, new_rating: float):
        print("in call repo")
        user_doc = await self._get_user_doc(uId)
        if user_doc.exists:
            await run_in_threadpool(user_doc.reference.update, {"postRating": new_rating})
            return {"message": "User rating updated"}
        else:
            return {"error": "User not found"}

    async def update_user_votes(self, uId: str, vote: bool):
        user_doc = await self._get_user_doc(uId)

        if user_doc.exists:
            user_data = user_doc.to_dict()
            if isinstance(user_data["commentsRating"], int):
                user_data["commentsRating"] += 1 if vote else -1
            else:
                logger.error("Invalid data type for commentsRating: expected int but got {}".format(type(user_data["commentsRating"])))
                return {"error": "Invalid data type for commentsRating"}

            await run_in_threadpool(user_doc.reference.update, user_data)
            return {"message": "User votes updated"}
        else:
            return {"error": "User not found"}

    async def get_user_by_id(self, uId: str):
        user_doc = await self._get_user_doc(uId)
        if user_doc.exists:
            user_data = user_doc.to_dict()
            user_data['userId'] = user_doc.id
            return user_data
        else:
            return {"error": "User not found"}

    async def get_all_users(self):
        users_ref = self.db.collection("users")
        users = await run_in_threadpool(lambda: list(users_ref.stream()))

        return [{"userId": user.id, **user.to_dict()} for user in users]

    async def delete_user(self, uId: str):
        user_doc = await self._get_user_doc(uId)

        if user_doc.exists:
            await run_in_threadpool(user_doc.reference.delete)
            return {"message": "User and all associated posts deleted"}
        else:
            return {"error": "User not found"}
