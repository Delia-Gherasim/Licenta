import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from Model.Post import Post
from Service.PostsService import PostsService

@pytest.fixture
def service():
    with patch("Service.PostsService.PostsRepository") as MockPostsRepo, \
         patch("Service.PostsService.CommentsRepository") as MockCommentsRepo, \
         patch("Service.PostsService.RatingsRepository") as MockRatingsRepo, \
         patch("Service.PostsService.VotesRepository") as MockVotesRepo, \
         patch("Service.PostsService.UsersRepository") as MockUsersRepo:

        posts_repo = MockPostsRepo.return_value
        comments_repo = MockCommentsRepo.return_value
        ratings_repo = MockRatingsRepo.return_value
        votes_repo = MockVotesRepo.return_value
        users_repo = MockUsersRepo.return_value

        posts_repo.get_single_post = AsyncMock(return_value={"id": "post1", "userId": "user1", "rating": 3.5})
        posts_repo.get_user_posts_from_firestore = AsyncMock(return_value={"posts": [{"postId": "post1"}]})
        posts_repo.get_all_posts_from_firestore = AsyncMock(return_value={"posts": ["post1", "post2"]})
        posts_repo.get_user_average_rating = AsyncMock(return_value={"averageRating": 4.0})
        posts_repo.get_user_posts_from_firestore = AsyncMock(return_value={"posts": [{"postId": "post1"}]})
        posts_repo.get_user_by_post = AsyncMock(return_value="user1")
        posts_repo.update_post = AsyncMock(return_value={"message": "post updated"})
        posts_repo.update_post_views = AsyncMock(return_value={"message": "views updated"})
        posts_repo.upload_to_firestore = AsyncMock(return_value={"message": "post uploaded"})
        posts_repo.update_post_rating = AsyncMock(return_value={"message": "post rating updated"})
        posts_repo.delete_post = AsyncMock(return_value={"message": "post deleted"})

        users_repo.get_user_by_id = AsyncMock(return_value={"id": "user1", "following": ["user2"], "followers": ["user2"]})
        users_repo.update_user_rating = AsyncMock(return_value={"message": "user rating updated"})

        ratings_repo.upload_or_update_rating = AsyncMock(return_value=None)
        ratings_repo.get_post_average_rating = AsyncMock(return_value={"averageRating": 4.5})
        ratings_repo.delete_all_ratings = AsyncMock(return_value={"message": "ratings deleted"})

        comments_repo.delete_post_and_comments = AsyncMock(return_value={"message": "comments deleted"})

        votes_repo.delete_all_votes = AsyncMock(return_value={"message": "votes deleted"})

        service = PostsService("fake_path")
        service.repo = posts_repo
        service.comments_repo = comments_repo
        service.ratings_repo = ratings_repo
        service.votes_repo = votes_repo
        service.user_repo = users_repo

        yield service

@pytest.mark.asyncio
async def test_retry_success(service):
    async def dummy():
        return "success"
    result = await service.retry(dummy)
    assert result == "success"

@pytest.mark.asyncio
async def test_retry_failure(service):
    count = 0
    async def fail():
        nonlocal count
        count += 1
        raise Exception("fail")
    with pytest.raises(Exception):
        await service.retry(fail, retries=2, delay=0)
    assert count == 2

@pytest.mark.asyncio
async def test_validate_user_and_post(service):
    assert await service._validate_user("user1")
    assert await service._validate_post("post1")

@pytest.mark.asyncio
async def test_get_all_posts_of_user_valid_and_invalid(service):
    res = await service.get_all_posts_of_user("user1")
    assert "posts" in res or isinstance(res, dict)

    service.user_repo.get_user_by_id.return_value = None
    res = await service.get_all_posts_of_user("baduser")
    assert "error" in res

@pytest.mark.asyncio
async def test_get_all_posts_for_user(service):
    res = await service.get_all_posts_for_user("user1")
    assert "posts" in res

@pytest.mark.asyncio
async def test_get_all_posts(service):
    res = await service.get_all_posts()
    assert "posts" in res

@pytest.mark.asyncio
async def test_get_user_by_post(service):
    res = await service.get_user_by_post("post1")
    assert "id" in res or "error" not in res

@pytest.mark.asyncio
async def test_get_user_by_post_invalid(service):
    res = await service.get_user_by_post("")
    assert "error" in res

@pytest.mark.asyncio
async def test_get_post_by_id(service):
    res = await service.get_post_by_id("post1")
    assert "id" in res or "error" not in res

@pytest.mark.asyncio
async def test_get_post_by_id_invalid(service):
    res = await service.get_post_by_id("")
    assert "error" in res

@pytest.mark.asyncio
async def test_update_post(service):
    post = Post(id="post1", userId="user1",  caption="caption1", date="2025-05-16", rating=4, url="http://test.com", views=1)
    res = await service.update_post("user1", post)
    assert "message" in res

@pytest.mark.asyncio
async def test_update_post_invalid(service):
    res = await service.update_post("user1", None)
    assert "error" in res

@pytest.mark.asyncio
async def test_update_post_views(service):
    res = await service.update_post_views("post1")
    assert "message" in res

@pytest.mark.asyncio
async def test_update_post_views_invalid(service):
    service.repo.get_single_post.return_value = None
    res = await service.update_post_views("badpost")
    assert "error" in res
    service.repo.get_single_post.return_value = {"id": "post1"}

@pytest.mark.asyncio
async def test_add_post(service):
    post = Post(id="post1", userId="user1", caption="caption1", date="2025-05-16", rating=4, url="http://test.com", views=1)
    res = await service.add_post(post)
    assert "message" in res

@pytest.mark.asyncio
async def test_add_post_invalid(service):
    post = Post(id="", userId="user1", caption="caption1", date="2025-05-16", rating=4, url="http://test.com", views=1)
    res = await service.add_post(post)
    assert "error" in res

@pytest.mark.asyncio
async def test_update_post_rating(service):
    res = await service.update_post_rating("post1", 4.5)
    assert "message" in res

@pytest.mark.asyncio
async def test_delete_post(service):
    res = await service.delete_post("user1", "post1")
    assert "message" in res

@pytest.mark.asyncio
async def test_delete_post_invalid(service):
    service.user_repo.get_user_by_id.return_value = None
    res = await service.delete_post("baduser", "post1")
    assert "error" in res
    service.user_repo.get_user_by_id.return_value = {"id": "user1"}

@pytest.mark.asyncio
async def test_delete_all_posts_of_user(service):
    res = await service.delete_all_posts_of_user("user1")
    assert "message" in res

@pytest.mark.asyncio
async def test_delete_all_posts_of_user_invalid(service):
    service.user_repo.get_user_by_id.return_value = None
    res = await service.delete_all_posts_of_user("baduser")
    assert "error" in res
