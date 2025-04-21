class Ratings:
    def __init__(self, userId, postId, value):
        if not isinstance(value, (int, float)):
            raise ValueError("value must be a numeric value (integer or float)")

        self._userId = userId
        self._postId = postId
        self._value = value

    @property
    def userId(self):
        return self._userId

    @userId.setter
    def userId(self, userId):
        self._userId = userId


    @property
    def postId(self):
        return self._postId

    @postId.setter
    def postId(self, postId):
        self._postId = postId


    @property
    def value(self):
        return self._value

    @value.setter
    def value(self, value):
        self._value = value
