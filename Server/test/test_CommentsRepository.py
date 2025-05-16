import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from Repository.CommentsRepository import CommentsRepository
from Model.Comment import Comment

@pytest.fixture
def fake_comment():
    return Comment(
        id="comment123",
        postId="post123",
        userId="user456",
        text="Test comment",
        date="2024-01-01",
        likes=0,
        parentId=None
    )

@pytest.fixture
def repo():
    with patch("Repository.CommentsRepository.FirebaseSingleton") as MockFirebase:
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.collection.return_value = mock_collection
        MockFirebase.return_value.get_firestore_client.return_value = mock_db
        repository = CommentsRepository("fake_path")
        return repository

@pytest.mark.asyncio
async def test_upload_comment_to_firestore(repo, fake_comment):
    mock_doc = MagicMock()
    mock_doc.id = "comment123"
    repo.comments_collection.document.return_value = mock_doc

    result = await repo.upload_comment_to_firestore(fake_comment)
    assert result == {"message": "Comment uploaded", "commentId": "comment123"}
    mock_doc.set.assert_called_once()

@pytest.mark.asyncio
async def test_get_single_comment_found(repo):
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.id = "c1"
    mock_doc.to_dict.return_value = {"text": "hello"}
    repo.comments_collection.document.return_value.get.return_value = mock_doc

    result = await repo.get_single_comment("c1")
    assert result["text"] == "hello"
    assert result["commentId"] == "c1"

@pytest.mark.asyncio
async def test_get_single_comment_not_found(repo):
    mock_doc = MagicMock()
    mock_doc.exists = False
    repo.comments_collection.document.return_value.get.return_value = mock_doc

    result = await repo.get_single_comment("nope")
    assert result == {"error": "Comment not found"}

@pytest.mark.asyncio
async def test_delete_comment(repo):
    result = await repo.delete_comment("c1")
    assert result == {"message": "Comment deleted"}
    repo.comments_collection.document.return_value.delete.assert_called_once()

@pytest.mark.asyncio
async def test_update_comment_with_data(repo):
    updated_comment = Comment(id="comment123", postId="post123", userId="user456", text="updated", date="d", likes=10, parentId=None)
    result = await repo.update_comment("c1", updated_comment)
    assert result == {"message": "Comment updated"}
    repo.comments_collection.document.return_value.update.assert_called_once()

@pytest.mark.asyncio
async def test_update_comment_no_fields_raises(repo):
    with pytest.raises(ValueError, match="Text must be a non-empty string"):
        updated_comment = Comment(
            id="comment123",
            postId="post123",
            userId="user456",
            text=None,  
            date="2024-01-01",
            likes=None,
            parentId=None
        )
        await repo.update_comment("c1", updated_comment)
