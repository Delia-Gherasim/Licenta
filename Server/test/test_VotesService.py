import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from Service.VotesService import VotesService

@pytest.fixture
def service():
    with patch("Service.VotesService.VotesRepository") as MockVotesRepo, \
         patch("Service.VotesService.CommentsRepository") as MockCommentsRepo, \
         patch("Service.VotesService.UsersRepository") as MockUsersRepo, \
         patch("Service.VotesService.PostsRepository") as MockPostsRepo:

        votes_repo = MockVotesRepo.return_value
        comments_repo = MockCommentsRepo.return_value
        users_repo = MockUsersRepo.return_value
        posts_repo = MockPostsRepo.return_value

        comments_repo.get_single_comment = AsyncMock(return_value={"id": "comm1", "userId": "user1"})
        users_repo.get_user_by_id = AsyncMock(return_value={"id": "user1"})
        votes_repo.get_comment_votes = AsyncMock(return_value=[{"vote": True}])
        votes_repo.get_comment_total_votes = AsyncMock(return_value=5)
        votes_repo.delete_all_votes = AsyncMock(return_value={"message": "all votes deleted"})
        votes_repo.get_user_vote = AsyncMock(return_value=True)
        votes_repo.upload_or_update_vote = AsyncMock(return_value=None)
        votes_repo.delete_vote = AsyncMock(return_value=None)
        comments_repo.update_comment_votes = AsyncMock(return_value=None)
        comments_repo.get_user_comments = AsyncMock(return_value=[{"likes": 1}, {"likes": 2}])
        posts_repo.get_user_posts_from_firestore = AsyncMock(return_value={"posts": [{"likes": 3}]})
        users_repo.update_user_likes = AsyncMock(return_value=None)

        service = VotesService("fake_path")
        service.votes_repo = votes_repo
        service.comments_repo = comments_repo
        service.users_repo = users_repo
        service.posts_repo = posts_repo

        yield service

@pytest.mark.asyncio
async def test_retry_success(service):
    async def dummy():
        return "ok"
    res = await service.retry(dummy)
    assert res == "ok"

@pytest.mark.asyncio
async def test_retry_failure(service):
    call_count = 0
    async def fail_func():
        nonlocal call_count
        call_count += 1
        raise Exception("fail")
    with pytest.raises(Exception):
        await service.retry(fail_func, retries=2, delay=0)
    assert call_count == 2

@pytest.mark.asyncio
async def test__validate_comment(service):
    assert await service._validate_comment("comm1") is not None
    service.comments_repo.get_single_comment.return_value = None
    assert await service._validate_comment("comm1") is None
    assert await service._validate_comment("") is "" 

@pytest.mark.asyncio
async def test__validate_user(service):
    assert await service._validate_user("user1") is not None
    service.users_repo.get_user_by_id.return_value = None
    assert await service._validate_user("user1") is None
    assert await service._validate_user("") is "" 


@pytest.mark.asyncio
async def test_get_votes_for_comment(service):
    res = await service.get_votes_for_comment("comm1")
    assert isinstance(res, list)
    service.comments_repo.get_single_comment.return_value = None
    with pytest.raises(ValueError):
        await service.get_votes_for_comment("comm1")

@pytest.mark.asyncio
async def test_get_total_votes_for_comment(service):
    res = await service.get_total_votes_for_comment("comm1")
    assert isinstance(res, int)
    service.comments_repo.get_single_comment.return_value = None
    with pytest.raises(ValueError):
        await service.get_total_votes_for_comment("comm1")

@pytest.mark.asyncio
async def test_remove_all_votes(service):
    res = await service.remove_all_votes("comm1")
    assert "message" in res
    service.comments_repo.get_single_comment.return_value = None
    with pytest.raises(ValueError):
        await service.remove_all_votes("comm1")

@pytest.mark.asyncio
async def test_get_user_vote_for_comment(service):
    res = await service.get_user_vote_for_comment("comm1", "user1")
    assert isinstance(res, bool)
    service.comments_repo.get_single_comment.return_value = None
    with pytest.raises(ValueError):
        await service.get_user_vote_for_comment("comm1", "user1")
    service.comments_repo.get_single_comment.return_value = {"id": "comm1"}
    service.users_repo.get_user_by_id.return_value = None
    with pytest.raises(ValueError):
        await service.get_user_vote_for_comment("comm1", "user1")

@pytest.mark.asyncio
async def test_vote_on_comment(service):
    res = await service.vote_on_comment("comm1", "user1", True)
    assert res["message"] == "Vote processed"
    service.comments_repo.get_single_comment.return_value = None
    with pytest.raises(ValueError):
        await service.vote_on_comment("comm1", "user1", True)
    service.comments_repo.get_single_comment.return_value = {"id": "comm1"}
    service.users_repo.get_user_by_id.return_value = None
    with pytest.raises(ValueError):
        await service.vote_on_comment("comm1", "user1", True)

@pytest.mark.asyncio
async def test_remove_vote(service):
    res = await service.remove_vote("comm1", "user1")
    assert res["message"] == "Vote removed"
    service.comments_repo.get_single_comment.return_value = None
    with pytest.raises(ValueError):
        await service.remove_vote("comm1", "user1")
    service.comments_repo.get_single_comment.return_value = {"id": "comm1"}
    service.users_repo.get_user_by_id.return_value = None
    with pytest.raises(ValueError):
        await service.remove_vote("comm1", "user1")

@pytest.mark.asyncio
async def test_update_user_total_likes(service):
    res = await service.update_user_total_likes("user1")
    assert isinstance(res, int)
