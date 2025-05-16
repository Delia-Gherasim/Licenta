import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from Service.CommentsService import CommentsService
from Model.Comment import Comment 

@pytest.fixture
def service():
    with patch("Service.CommentsService.CommentsRepository") as MockCommentsRepo, \
         patch("Service.CommentsService.VotesRepository") as MockVotesRepo, \
         patch("Service.CommentsService.PostsRepository") as MockPostsRepo, \
         patch("Service.CommentsService.UsersRepository") as MockUsersRepo:

        comments_repo = MockCommentsRepo.return_value
        votes_repo = MockVotesRepo.return_value
        posts_repo = MockPostsRepo.return_value
        users_repo = MockUsersRepo.return_value

        posts_repo.get_single_post = AsyncMock(return_value={"id": "post1"})
        users_repo.get_user_by_id = AsyncMock(return_value={"id": "user1"})
        comments_repo.get_single_comment = AsyncMock(return_value={"id": "comm1", "postId": "post1", "userId": "user1", "text": "text", "date": "2025-05-16", "likes": 0})
        comments_repo.upload_comment_to_firestore = AsyncMock(return_value={"message": "uploaded"})
        comments_repo.get_post_comments_from_firestore = AsyncMock(return_value=[{"id": "comm1"}])
        comments_repo.update_comment = AsyncMock(return_value={"message": "updated"})
        comments_repo.delete_comment = AsyncMock(return_value={"message": "deleted"})
        comments_repo.delete_comments_and_replies = AsyncMock(return_value={"message": "deleted replies"})
        comments_repo.delete_post_and_comments = AsyncMock(return_value={"message": "deleted post comments"})
        comments_repo.get_user_comments = AsyncMock(return_value=[{"likes": 1}, {"likes": 2}])
        comments_repo.get_comment_tree = AsyncMock(return_value=[MagicMock(id="c2"), MagicMock(id="c3")])
        votes_repo.delete_all_votes = AsyncMock(return_value={"message": "votes deleted"})
        users_repo.update_user_votes = AsyncMock(return_value={"message": "user votes updated"})

        service = CommentsService("fake_path")
        service.comments_repo = comments_repo
        service.votes_repo = votes_repo
        service.posts_repo = posts_repo
        service.users_repo = users_repo
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
async def test_validate_ids(service):
    err = await service._validate_ids("post1", "user1", "comm1")
    assert err is None
    service.posts_repo.get_single_post.return_value = None
    err = await service._validate_ids(postId="bad_post")
    assert "Invalid post ID" in err
    service.posts_repo.get_single_post.return_value = {"id": "post1"}
    service.users_repo.get_user_by_id.return_value = None
    err = await service._validate_ids(userId="bad_user")
    assert "Invalid user ID" in err
    service.users_repo.get_user_by_id.return_value = {"id": "user1"}
    service.comments_repo.get_single_comment.return_value = None
    err = await service._validate_ids(commentId="bad_comm")
    assert "Invalid comment ID" in err
    service.comments_repo.get_single_comment.return_value = {"id": "comm1"}

@pytest.mark.asyncio
async def test_create_comment(service):
    res = await service.create_comment("post1", "user1", "hello")
    assert res == {"message": "uploaded"}
    res = await service.create_comment(None, "user1", "hello")
    assert "error" in res

@pytest.mark.asyncio
async def test_get_post_comments(service):
    res = await service.get_post_comments("post1")
    assert isinstance(res, list)

    res = await service.get_post_comments(None)
    assert "error" in res

@pytest.mark.asyncio
async def test_get_single_comment(service):
    res = await service.get_single_comment("comm1")
    assert isinstance(res, dict)

    res = await service.get_single_comment(None)
    assert "error" in res

@pytest.mark.asyncio
async def test_update_comment(service):
    res = await service.update_comment("comm1", text="updated")
    assert "message" in res
    res = await service.update_comment(None)
    assert "error" in res
    service.comments_repo.get_single_comment.return_value = None
    res = await service.update_comment("bad_comm")
    assert "error" in res
    service.comments_repo.get_single_comment.return_value = {"id": "comm1", "postId": "post1", "userId": "user1", "text": "text", "date": "2025-05-16", "likes": 0}

@pytest.mark.asyncio
async def test_delete_comment(service):
    res = await service.delete_comment("comm1")
    assert "message" in res

    res = await service.delete_comment(None)
    assert "error" in res

@pytest.mark.asyncio
async def test_delete_comments_and_replies(service):
    res = await service.delete_comments_and_replies("comm1")
    assert "message" in res

    res = await service.delete_comments_and_replies(None)
    assert "error" in res

@pytest.mark.asyncio
async def test_delete_post_and_comments(service):
    res = await service.delete_post_and_comments("post1")
    assert "message" in res

    res = await service.delete_post_and_comments(None)
    assert "error" in res

@pytest.mark.asyncio
async def test_get_user_comments(service):
    res = await service.get_user_comments("user1")
    assert isinstance(res, list)

    res = await service.get_user_comments(None)
    assert "error" in res

@pytest.mark.asyncio
async def test_get_comment_tree(service):
    res = await service.get_comment_tree("post1", "comm1")
    assert isinstance(res, list)

    res = await service.get_comment_tree(None, "comm1")
    assert "error" in res

@pytest.mark.asyncio
async def test_delete_comment_replies_and_votes(service):
    res = await service.delete_comment_replies_and_votes("comm1")
    assert "message" in res

    res = await service.delete_comment_replies_and_votes(None)
    assert "error" in res

@pytest.mark.asyncio
async def test_update_user_total_likes(service):
    res = await service.update_user_total_likes("user1")
    assert "message" in res
