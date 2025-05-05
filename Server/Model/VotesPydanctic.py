from pydantic import BaseModel

class VoteRequest(BaseModel):
    commentId: str
    userId: str
    vote: bool

class VoteDeleteRequest(BaseModel):
    commentId: str
    userId: str

class CommentIdRequest(BaseModel):
    commentId: str
