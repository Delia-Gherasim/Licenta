from pydantic import BaseModel, Field
from typing import Optional
from datetime import date as d

class CommentPydantic(BaseModel):
    postId: str = Field(..., description="ID of the post")
    userId: str = Field(..., description="ID of the user")
    text: str = Field(..., min_length=1, description="Content of the comment")
    date: d = Field(..., description="Date of the comment")
    likes: int = Field(0, ge=0, description="Number of likes on the comment")
    parentId: Optional[str] = Field(None, description="ID of the parent comment")


