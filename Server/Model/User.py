class User:
    def __init__(self, id, name, email, bio, postRatings=0, commentsLikes=0, followers=None, following=None):
        self._id = id

        if not isinstance(name, str) or len(name) == 0:
            raise ValueError("Name must be a non-empty string")
        self._name = name

        if not isinstance(email, str) or "@" not in email:
            raise ValueError("Invalid email address")
        self._email = email

        if not isinstance(bio, str):
            raise ValueError("Bio must be a string")
        self._bio = bio

        if not isinstance(postRatings, (int, float)):
            raise ValueError("Post ratings must be a numeric value")
        self._postRatings = postRatings

        if not isinstance(commentsLikes, (int, float)):
            raise ValueError("Comment likes must be a numeric value")
        self._commentsLikes = commentsLikes

        if followers is not None and not isinstance(followers, list):
            raise ValueError("Followers must be a list")
        self._followers = followers if followers is not None else []

        if following is not None and not isinstance(following, list):
            raise ValueError("Following must be a list")
        self._following = following if following is not None else []

    @property
    def id(self):
        return self._id

    @id.setter
    def id(self, value):
        self._id = value

    @property
    def name(self):
        return self._name

    @name.setter
    def name(self, value):
        if isinstance(value, str) and len(value) > 0:
            self._name = value
        else:
            raise ValueError("Name must be a non-empty string")

    @property
    def email(self):
        return self._email

    @email.setter
    def email(self, value):
        if isinstance(value, str) and "@" in value:
            self._email = value
        else:
            raise ValueError("Invalid email address")

    @property
    def bio(self):
        return self._bio

    @bio.setter
    def bio(self, value):
        if isinstance(value, str):
            self._bio = value
        else:
            raise ValueError("Bio must be a string")

    @property
    def postRatings(self):
        return self._postRatings

    @postRatings.setter
    def postRatings(self, value):
        if isinstance(value, (int, float)):
            self._postRatings = value
        else:
            raise ValueError("Post ratings must be a numeric value")
        
    @property
    def commentsLikes(self):
        return self._commentsLikes

    @commentsLikes.setter
    def commentsLikes(self, value):
        if isinstance(value, (int, float)):
            self._commentsLikes = value
        else:
            raise ValueError("Comment likes must be a numeric value")

    @property
    def followers(self):
        return self._followers

    @followers.setter
    def followers(self, value):
        if isinstance(value, list):
            self._followers = value
        else:
            raise ValueError("Followers must be a list")

    @property
    def following(self):
        return self._following

    @following.setter
    def following(self, value):
        if isinstance(value, list):
            self._following = value
        else:
            raise ValueError("Following must be a list")

    def add_follower(self, user):
        if user not in self._followers:
            self._followers.append(user)
        else:
            print(f"{user} is already following this user.")

    def remove_follower(self, user):
        if user in self._followers:
            self._followers.remove(user)
        else:
            print(f"{user} is not following this user.")

    def add_following(self, user):
        if user not in self._following:
            self._following.append(user)
        else:
            print(f"You are already following {user}.")

    def remove_following(self, user):
        if user in self._following:
            self._following.remove(user)
        else:
            print(f"You are not following {user}.")

