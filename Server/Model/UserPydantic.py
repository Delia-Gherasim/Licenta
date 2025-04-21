from pydantic import BaseModel, EmailStr
from typing import List, Optional

class UserPydantic(BaseModel):
    id: str
    name: str
    email: EmailStr
    bio: str
    postRatings: Optional[float] = 0
    commentsLikes: Optional[float] = 0
    followers: Optional[List[str]] = []
    following: Optional[List[str]] = []

