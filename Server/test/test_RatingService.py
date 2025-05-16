import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from Service.RatingService import RatingService

@pytest.fixture
def service():
    with patch("Service.RatingService.RatingsRepository") as MockRatingsRepo, \
         patch("Service.RatingService.PostsRepository") as MockPostsRepo, \
         patch("Service.RatingService.UsersRepository") as MockUsersRepo:

        ratings_repo = MockRatingsRepo.return_value
        posts_repo = MockPostsRepo.return_value
        users_repo = MockUsersRepo.return_value

        posts_repo.get_single_post = AsyncMock(return_value={"id": "post1", "userId": "user1"})
        users_repo.get_user_by_id = AsyncMock(return_value={"id": "user1"})
        ratings_repo.upload_or_update_rating = AsyncMock(return_value={"message": "success"})
        ratings_repo.get_post_average_rating = AsyncMock(return_value=4.5)
        ratings_repo.get_user_average_rating = AsyncMock(return_value=4.2)
        ratings_repo.get_post_ratings = AsyncMock(return_value=[{"rating": 4}, {"rating": 5}])
        ratings_repo.get_rating = AsyncMock(return_value={"rating": 5})
        ratings_repo.delete_rating = AsyncMock(return_value={"message": "deleted"})
        ratings_repo.delete_all_ratings = AsyncMock(return_value={"message": "all deleted"})
        posts_repo.get_user_average_rating = AsyncMock(return_value=4.2)
        posts_repo.update_post_rating = AsyncMock(return_value={"message": "post rating updated"})
        users_repo.update_user_rating = AsyncMock(return_value={"message": "user rating updated"})

        service = RatingService("fake_path")
        service.ratings_repo = ratings_repo
        service.posts_repo = posts_repo
        service.users_repo = users_repo

        yield service

@pytest.mark.asyncio
async def test_retry_success(service):
    async def dummy():
        return "ok"
    result = await service.retry(dummy)
    assert result == "ok"

@pytest.mark.asyncio
async def test_retry_failure(service):
    attempts = 0
    async def fail():
        nonlocal attempts
        attempts += 1
        raise Exception("fail")
    with pytest.raises(Exception):
        await service.retry(fail, retries=2, delay=0)
    assert attempts == 2

@pytest.mark.asyncio
async def test_validate_post_and_user(service):
    err = await service._validate_post_and_user("post1", "user1")
    assert err is None
    service.posts_repo.get_single_post.return_value = None
    err = await service._validate_post_and_user("bad_post", "user1")
    assert err is not None and "Invalid post ID" in err.get("error", "")
    service.posts_repo.get_single_post.return_value = {"id": "post1", "userId": "user1"}
    service.users_repo.get_user_by_id.return_value = None
    err = await service._validate_post_and_user("post1", "bad_user")
    assert err is not None and "Invalid user ID" in err.get("error", "")
    service.users_repo.get_user_by_id.return_value = {"id": "user1"}


@pytest.mark.asyncio
async def test_rate_post_success(service):
    res = await service.rate_post("post1", "user1", 4.0)
    assert "message" in res and "successfully" in res["message"]

@pytest.mark.asyncio
async def test_rate_post_missing_fields(service):
    res = await service.rate_post(None, "user1", 4.0)
    assert "error" in res

@pytest.mark.asyncio
async def test_rate_post_invalid_post(service):
    service.posts_repo.get_single_post.return_value = None
    res = await service.rate_post("bad_post", "user1", 4.0)
    assert "error" in res
    service.posts_repo.get_single_post.return_value = {"id": "post1", "userId": "user1"}

@pytest.mark.asyncio
async def test_get_ratings_for_post_success(service):
    res = await service.get_ratings_for_post("post1")
    assert isinstance(res, list)

@pytest.mark.asyncio
async def test_get_ratings_for_post_invalid(service):
    service.posts_repo.get_single_post.return_value = None
    res = await service.get_ratings_for_post("bad_post")
    assert "error" in res
    service.posts_repo.get_single_post.return_value = {"id": "post1", "userId": "user1"}

@pytest.mark.asyncio
async def test_get_average_rating_for_post_success(service):
    res = await service.get_average_rating_for_post("post1")
    assert isinstance(res, (float, dict))

@pytest.mark.asyncio
async def test_get_user_rating_for_post_success(service):
    res = await service.get_user_rating_for_post("post1", "user1")
    assert "rating" in res

@pytest.mark.asyncio
async def test_get_user_rating_for_post_missing_fields(service):
    res = await service.get_user_rating_for_post(None, "user1")
    assert "error" in res
    res = await service.get_user_rating_for_post("post1", None)
    assert "error" in res

@pytest.mark.asyncio
async def test_remove_rating_success(service):
    res = await service.remove_rating("post1", "user1")
    assert "message" in res

@pytest.mark.asyncio
async def test_remove_rating_no_existing(service):
    service.ratings_repo.get_rating.return_value = None
    res = await service.remove_rating("post1", "user1")
    assert "error" in res
    service.ratings_repo.get_rating.return_value = {"rating": 5}

@pytest.mark.asyncio
async def test_remove_all_ratings_for_post_success(service):
    res = await service.remove_all_ratings_for_post("post1")
    assert "message" in res

@pytest.mark.asyncio
async def test_remove_all_ratings_for_post_invalid(service):
    service.posts_repo.get_single_post.return_value = None
    res = await service.remove_all_ratings_for_post("bad_post")
    assert "error" in res
    service.posts_repo.get_single_post.return_value = {"id": "post1", "userId": "user1"}

@pytest.mark.asyncio
async def test_remove_all_ratings_for_post_no_ratings(service):
    service.ratings_repo.get_post_ratings.return_value = []
    res = await service.remove_all_ratings_for_post("post1")
    assert "error" in res
    service.ratings_repo.get_post_ratings.return_value = [{"rating": 4}]
