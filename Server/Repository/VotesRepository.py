from FirebaseSingleton import FirebaseSingleton
from fastapi.concurrency import run_in_threadpool
from typing import List, Dict


class VotesRepository:
    def __init__(self, cred_path: str):
        self.firebase_instance = FirebaseSingleton(cred_path)
        self.db = self.firebase_instance.get_firestore_client()
        self.collection_name = "votes"

    async def calculate_total_votes(self, cId: str) -> int:
        votes_ref = self.db.collection(self.collection_name).where("commId", "==", cId)
        votes = await run_in_threadpool(lambda: list(votes_ref.stream()))

        total_votes = 0
        for vote in votes:
            data = vote.to_dict()
            total_votes += 1 if data.get("vote", False) else -1

        return total_votes

    async def upload_or_update_vote(self, cId: str, uId: str, vote: bool) -> Dict[str, str]:
        doc_id = f"{cId}_{uId}"
        vote_ref = self.db.collection(self.collection_name).document(doc_id)
        vote_doc = await run_in_threadpool(vote_ref.get)

        if vote_doc.exists:
            await run_in_threadpool(vote_ref.update, {"vote": vote})
            return {"message": "Vote updated"}

        data = {
            "userId": uId,
            "commId": cId,
            "vote": vote
        }

        await run_in_threadpool(vote_ref.set, data)
        return {"message": "Vote uploaded"}

    async def get_comment_votes(self, cId: str) -> List[Dict]:
        votes_ref = self.db.collection(self.collection_name).where("commId", "==", cId)
        votes = await run_in_threadpool(lambda: list(votes_ref.stream()))

        vote_list = []
        for vote in votes:
            data = vote.to_dict()
            data["voteId"] = vote.id
            vote_list.append(data)

        return vote_list

    async def get_comment_total_votes(self, cId: str) -> Dict[str, int]:
        total_votes = await self.calculate_total_votes(cId)
        return {"commId": cId, "totalVotes": total_votes}

    async def delete_vote(self, cId: str, uId: str) -> Dict[str, str]:
        doc_id = f"{cId}_{uId}"
        vote_ref = self.db.collection(self.collection_name).document(doc_id)
        await run_in_threadpool(vote_ref.delete)
        return {"message": "Vote deleted"}

    async def delete_all_votes(self, cId: str) -> Dict[str, str]:
        votes_ref = self.db.collection(self.collection_name).where("commId", "==", cId)
        votes = await run_in_threadpool(lambda: list(votes_ref.stream()))
        batch = self.db.batch()

        for vote in votes:
            batch.delete(vote.reference)

        await run_in_threadpool(batch.commit)
        return {"message": f"All votes for comment {cId} deleted"}

    async def get_user_vote(self, cId: str, uId: str) -> Dict[str, any]:
        doc_id = f"{cId}_{uId}"
        vote_ref = self.db.collection(self.collection_name).document(doc_id)
        vote_doc = await run_in_threadpool(vote_ref.get)

        if vote_doc.exists:
            data = vote_doc.to_dict()
            return {"userId": data["userId"], "vote": data["vote"]}
        else:
            return {"userId": uId, "vote": None}
