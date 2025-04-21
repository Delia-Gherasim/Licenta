from typing import List
from pydantic import BaseModel, Field, HttpUrl, validator
from Model.Post import Post

class PostPydantic(BaseModel):
    user_id: str
    caption: str = Field(..., min_length=1)
    date: str  
    rating: float
    url: HttpUrl
    views: int = Field(default=0, ge=0)
    hashtags: List[str] = Field(default_factory=list)

    @validator("hashtags", pre=True, each_item=True)
    def check_hashtag(cls, v):
        if not isinstance(v, str):
            raise ValueError("Each hashtag must be a string")
        return v

    def to_post(self, post_id: str) -> Post:
        return Post(
            id=post_id,
            userId=self.user_id,
            caption=self.caption,
            date=self.date,
            rating=self.rating,
            url=str(self.url),
            views=self.views,
            hashtags=self.hashtags
        )

