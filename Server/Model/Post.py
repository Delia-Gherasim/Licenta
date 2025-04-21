class Post:
    def __init__(self, id, userId, caption, date, rating, url,  views=0, hashtags=None):
        self._id = id
        self._userId = userId

        if not isinstance(caption, str) or len(caption) == 0:
            raise ValueError("Caption must be a non-empty string")
        self._caption = caption

        if not isinstance(date, str):
            raise ValueError("Date must be a string in the format 'YYYY-MM-DD'")
        self._date = date

        if not isinstance(rating, (int, float)):
            raise ValueError("Rating must be a numeric value")
        self._rating = rating

        if not isinstance(url, str) or not url.startswith("http"):
            raise ValueError("URL must be a valid string starting with 'http'")
        self._url = url

        if not isinstance(views, int) or views < 0:
            raise ValueError("Views must be a non-negative integer")
        self._views = views

        if hashtags is not None and not isinstance(hashtags, list):
            raise ValueError("Hashtags must be provided as a list of strings")
        self._hashtags = hashtags if hashtags is not None else []

    @property
    def id(self):
        return self._id

    @id.setter
    def id(self, value):
        self._id = value

    @property
    def userId(self):
        return self._userId

    @userId.setter
    def userId(self, value):
        self._userId = value

    @property
    def caption(self):
        return self._caption

    @caption.setter
    def caption(self, value):
        if not isinstance(value, str) or len(value) == 0:
            raise ValueError("Caption must be a non-empty string")
        self._caption = value

    @property
    def date(self):
        return self._date

    @date.setter
    def date(self, value):
        if not isinstance(value, str):
            raise ValueError("Date must be a string in the format 'YYYY-MM-DD'")
        self._date = value

    @property
    def rating(self):
        return self._rating

    @rating.setter
    def rating(self, value):
        if not isinstance(value, (int, float)):
            raise ValueError("Rating must be a numeric value")
        self._rating = value

    @property
    def views(self):
        return self._views

    @views.setter
    def views(self, value):
        if not isinstance(value, int) or value < 0:
            raise ValueError("Views must be a non-negative integer")
        self._views = value

    @property
    def url(self):
        return self._url

    @url.setter
    def url(self, value):
        if not isinstance(value, str) or not value.startswith("http"):
            raise ValueError("URL must be a valid string starting with 'http'")
        self._url = value

    @property
    def hashtags(self):
        return self._hashtags

    @hashtags.setter
    def hashtags(self, value):
        if not isinstance(value, list):
            raise ValueError("Hashtags must be provided as a list of strings")
        self._hashtags = value

    def add_hashtag(self, hashtag):
        if isinstance(hashtag, str) and hashtag not in self._hashtags:
            self._hashtags.append(hashtag)
        else:
            print(f"Hashtag '{hashtag}' already exists or is invalid.")

    def remove_hashtag(self, hashtag):
        if hashtag in self._hashtags:
            self._hashtags.remove(hashtag)
        else:
            print(f"Hashtag '{hashtag}' not found.")

    
