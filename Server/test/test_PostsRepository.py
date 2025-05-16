import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from Model.Post import Post
from Repository.PostsRepository import PostsRepository

@pytest.fixture
def fake_post():
    return Post(
        id="post123",
        userId="user456",
        caption="Test caption",
        date="2024-01-01",
        rating=4.5,
        url="http://example.com/image.jpg",
        views=10,
        hashtags=["#test", "#pytest"]
    )

@pytest.fixture
def repo():
    with patch("Repository.PostsRepository.FirebaseSingleton") as MockFirebase:
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.collection.return_value = mock_collection
        MockFirebase.return_value.get_firestore_client.return_value = mock_db
        repository = PostsRepository("fake_path")
        return repository

@pytest.mark.asyncio
async def test_upload_to_firestore(repo, fake_post):
    mock_doc = MagicMock()
    repo.posts_collection.document.return_value = mock_doc

    result = await repo.upload_to_firestore(fake_post)
    assert result == {"message": "Post uploaded", "postId": fake_post.id, "url": fake_post.url}
    mock_doc.set.assert_called_once()

@pytest.mark.asyncio
async def test_get_single_post_found(repo, fake_post):
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.id = fake_post.id
    mock_doc.to_dict.return_value = {
        "caption": fake_post.caption,
        "userId": fake_post.userId,
        "date": fake_post.date,
        "rating": fake_post.rating,
        "url": fake_post.url,
        "views": fake_post.views,
        "hashtags": fake_post.hashtags
    }
    repo.posts_collection.document.return_value.get.return_value = mock_doc

    result = await repo.get_single_post(fake_post.id)
    assert result["postId"] == fake_post.id
    assert result["caption"] == fake_post.caption

@pytest.mark.asyncio
async def test_get_single_post_not_found(repo):
    mock_doc = MagicMock()
    mock_doc.exists = False
    repo.posts_collection.document.return_value.get.return_value = mock_doc

    result = await repo.get_single_post("no_post")
    assert result == {"error": "Post not found"}

@pytest.mark.asyncio
async def test_update_post_authorized(repo, fake_post):
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {"userId": fake_post.userId}
    repo._fetch_document = AsyncMock(return_value=mock_doc)
    repo.posts_collection.document.return_value.update = MagicMock()

    updated_post = Post(
        id=fake_post.id, userId=fake_post.userId, caption="new caption", date="2024-01-01",
        rating=5, url="http://example.com/image.jpg", views=10, hashtags=None
    )
    result = await repo.update_post(fake_post.userId, fake_post.id, updated_post)

    assert result == {"message": "Post updated"}
    called_args = repo.posts_collection.document.return_value.update.call_args[0][0]
    assert called_args["caption"] == "new caption"


@pytest.mark.asyncio
async def test_delete_post_authorized(repo, fake_post):
    mock_post_doc = MagicMock()
    mock_post_doc.exists = True
    mock_post_doc.to_dict.return_value = {"userId": fake_post.userId}
    repo.posts_collection.document.return_value.get = MagicMock(return_value=mock_post_doc)

    mock_rating_doc = MagicMock()
    mock_comment_doc = MagicMock()
    mock_rating_doc.reference = MagicMock()
    mock_comment_doc.reference = MagicMock()
    repo.ratings_collection.where.return_value.stream = MagicMock(return_value=[mock_rating_doc])
    repo.comments_collection.where.return_value.stream = MagicMock(return_value=[mock_comment_doc])

    batch_mock = MagicMock()
    repo.db.batch.return_value = batch_mock
    batch_mock.commit = AsyncMock()

    result = await repo.delete_post(fake_post.userId, fake_post.id)

    assert result == {"message": "Post and related data deleted"}
    batch_mock.delete.assert_any_call(mock_rating_doc.reference)
    batch_mock.delete.assert_any_call(mock_comment_doc.reference)
    batch_mock.delete.assert_any_call(repo.posts_collection.document.return_value)
    batch_mock.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_update_post_unauthorized(repo, fake_post):
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {"userId": "different_user"}
    repo._fetch_document = AsyncMock(return_value=mock_doc)

    updated_post = Post(id=fake_post.id, userId=fake_post.userId, caption="new caption", date="2024-01-01", rating=5, url="http://example.com/image.jpg", views=10, hashtags=None)
    result = await repo.update_post(fake_post.userId, fake_post.id, updated_post)

    assert result == {"error": "Unauthorized to update this post"}


@pytest.mark.asyncio
async def test_delete_post_unauthorized(repo, fake_post):
    mock_post_doc = MagicMock()
    mock_post_doc.exists = True
    mock_post_doc.to_dict.return_value = {"userId": "other_user"}
    repo.posts_collection.document.return_value.get = MagicMock(return_value=mock_post_doc)


    result = await repo.delete_post(fake_post.userId, fake_post.id)
    assert result == {"error": "Unauthorized to delete this post"}

@pytest.mark.asyncio
async def test_delete_post_not_found(repo):
    mock_post_doc = MagicMock()
    mock_post_doc.exists = False
    repo.posts_collection.document.return_value.get = MagicMock(return_value=mock_post_doc)

    result = await repo.delete_post("user", "no_post")
    assert result == {"error": "Post not found"}
