
class Comment:
    def __init__(self, id, postId, userId, text, date, likes=0, parentId=None):
        self._id = id
        self._postId = postId
        self._userId = userId

        if not isinstance(text, str) or len(text) == 0:
            raise ValueError("Text must be a non-empty string")
        self._text = text

        if not isinstance(date, str):
            raise ValueError("Date must be a string in the format 'YYYY-MM-DD'")
        self._date = date

        if not isinstance(likes, int) or likes < 0:
            raise ValueError("Likes must be a non-negative integer")
        self._likes = likes

        self._parentId = parentId

    @property
    def id(self):
        return self._id

    @property
    def postId(self):
        return self._postId

    @postId.setter
    def postId(self, value):
        self._postId = value

    @property
    def userId(self):
        return self._userId

    @userId.setter
    def userId(self, value):
        self._userId = value

    @property
    def text(self):
        return self._text

    @text.setter
    def text(self, value):
        if not isinstance(value, str) or len(value) == 0:
            raise ValueError("Text must be a non-empty string")
        self._text = value

    @property
    def date(self):
        return self._date

    @date.setter
    def date(self, value):
        if not isinstance(value, str):
            raise ValueError("Date must be a string in the format 'YYYY-MM-DD'")
        self._date = value

    @property
    def likes(self):
        return self._likes

    @likes.setter
    def likes(self, value):
        if not isinstance(value, int) or value < 0:
            raise ValueError("Likes must be a non-negative integer")
        self._likes = value

    @property
    def parentId(self):
        return self._parentId

    @parentId.setter
    def parentId(self, value):
        self._parentId = value

    def like(self):
        self._likes += 1

    def dislike(self):
        if self._likes > 0:
            self._likes -= 1
