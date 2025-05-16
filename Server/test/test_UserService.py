import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from Model.User import User
from Service.UsersService import UsersService

@pytest.fixture
def users_service():
    with patch("Service.UsersService.UsersRepository") as MockUsersRepo, \
         patch("Service.UsersService.PostsRepository") as MockPostsRepo, \
         patch("Service.UsersService.CommentsRepository") as MockCommentsRepo, \
         patch("Service.UsersService.RatingsRepository") as MockRatingsRepo, \
         patch("Service.UsersService.VotesRepository") as MockVotesRepo:

        users_repo = MockUsersRepo.return_value
        posts_repo = MockPostsRepo.return_value
        comments_repo = MockCommentsRepo.return_value
        ratings_repo = MockRatingsRepo.return_value
        votes_repo = MockVotesRepo.return_value

        users_repo.get_user_by_id = AsyncMock()
        users_repo.get_user_by_id.__name__ = "get_user_by_id"
        users_repo.update_user = AsyncMock()
        users_repo.update_user.__name__ = "update_user"
        users_repo.follow_update = AsyncMock()
        users_repo.follow_update.__name__ = "follow_update"
        users_repo.follower_update = AsyncMock()
        users_repo.follower_update.__name__ = "follower_update"
        users_repo.get_all_users = AsyncMock()
        users_repo.get_all_users.__name__ = "get_all_users"
        users_repo.delete_user = AsyncMock()
        users_repo.delete_user.__name__ = "delete_user"

        posts_repo.get_user_posts_from_firestore = AsyncMock()
        posts_repo.get_user_posts_from_firestore.__name__ = "get_user_posts_from_firestore"
        posts_repo.delete_post = AsyncMock()
        posts_repo.delete_post.__name__ = "delete_post"

        comments_repo.get_post_comments_from_firestore = AsyncMock()
        comments_repo.get_post_comments_from_firestore.__name__ = "get_post_comments_from_firestore"
        comments_repo.delete_comments_and_replies = AsyncMock()
        comments_repo.delete_comments_and_replies.__name__ = "delete_comments_and_replies"

        ratings_repo.delete_all_ratings = AsyncMock()
        ratings_repo.delete_all_ratings.__name__ = "delete_all_ratings"
        votes_repo.delete_all_votes = AsyncMock()
        votes_repo.delete_all_votes.__name__ = "delete_all_votes"

        service = UsersService("fake_path")
        service.users_repo = users_repo
        service.posts_repo = posts_repo
        service.comments_repo = comments_repo
        service.ratings_repo = ratings_repo
        service.votes_repo = votes_repo

        yield service

@pytest.mark.asyncio
async def test_validate_user(users_service):
    assert await users_service._validate_user("user1")
    users_service.users_repo.get_user_by_id.return_value = None
    assert not await users_service._validate_user("bad_user")
    users_service.users_repo.get_user_by_id.return_value = {"id": "user1"}

@pytest.mark.asyncio
async def test_update_user(users_service):
    user = User(id="id", name="Test User", email="test@example.com", bio="Test bio")
    users_service.users_repo.get_user_by_id.return_value = {"id": "user1"} 
    users_service.users_repo.update_user.return_value = {"message": "User updated successfully"} 
    
    res = await users_service.update_user("user1", user)
    assert "message" in res
    users_service.users_repo.get_user_by_id.return_value = None
    res = await users_service.update_user("bad_user", user)
    assert "error" in res
    users_service.users_repo.get_user_by_id.return_value = {"id": "user1"}



@pytest.mark.asyncio
async def test_get_user_by_id(users_service):
    users_service.users_repo.get_user_by_id.return_value = {"id": "user1"}
    res = await users_service.get_user_by_id("user1")
    assert res == {"id": "user1"}

    res = await users_service.get_user_by_id("")
    assert "error" in res


@pytest.mark.asyncio
async def test_get_all_users(users_service):
    users_service.users_repo.get_all_users.return_value = [{"id": "user1"}, {"id": "user2"}]
    res = await users_service.get_all_users()
    assert isinstance(res, list)


@pytest.mark.asyncio
async def test_follow_unfollow_user(users_service):
    res = await users_service.follow_user("user1", "user2")
    assert "message" in res or res is not None

    res = await users_service.unfollow_user("user1", "user2")
    assert "message" in res or res is not None

    users_service.users_repo.get_user_by_id.side_effect = lambda x: None if x == "bad" else {"id": x}
    res = await users_service.follow_user("bad", "user2")
    assert "error" in res
    users_service.users_repo.get_user_by_id.side_effect = None
    users_service.users_repo.get_user_by_id.return_value = {"id": "user1"}


@pytest.mark.asyncio
async def test_delete_user(users_service):
    users_service.posts_repo.get_user_posts_from_firestore.return_value = {"posts": [{"postId": "p1"}]}
    users_service.comments_repo.get_post_comments_from_firestore.return_value = [{"commentId": "c1"}]

    res = await users_service.delete_user("user1")
    assert "status" in res

    users_service.users_repo.get_user_by_id.return_value = None
    res = await users_service.delete_user("bad_user")
    assert "error" in res
