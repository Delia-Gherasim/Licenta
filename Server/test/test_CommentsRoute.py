import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

mock_collection = MagicMock()
mock_db = MagicMock()
mock_db.collection.return_value = mock_collection

with patch("firebase_admin.initialize_app"), \
     patch("firebase_admin.firestore.client", return_value=mock_db):

    from Routes.Data.Comment import router  

client = TestClient(router)

@pytest.fixture
def mock_comments_service():
    with patch("Routes.Data.Comment.comments_service") as mock_service:
        mock_service.create_comment = AsyncMock(return_value={"message": "created"})
        mock_service.get_single_comment = AsyncMock(return_value={"id": "comm1", "text": "hi"})
        mock_service.update_comment = AsyncMock(return_value={"message": "updated"})
        mock_service.delete_comment = AsyncMock(return_value={"message": "deleted"})
        mock_service.get_post_comments = AsyncMock(return_value=[{"id": "c1"}])
        mock_service.delete_post_and_comments = AsyncMock(return_value={"message": "post and comments deleted"})
        mock_service.get_comment_tree = AsyncMock(return_value=[{"id": "c1"}, {"id": "c2"}])
        mock_service.get_user_comments = AsyncMock(return_value=[{"id": "c1"}, {"id": "c2"}])
        yield mock_service

def test_create_comment_success(mock_comments_service):
    data = {
        "postId": "post1",
        "userId": "user1",
        "text": "Test comment",
        "parentId": None,
        "date": "2025-05-16"
    }
    response = client.post("/", json=data)
    assert response.status_code == 200
    assert response.json() == {"message": "created"}

def test_get_comment_by_id_success(mock_comments_service):
    response = client.get("/comm1")
    assert response.status_code == 200
    assert "id" in response.json()

def test_update_comment_success(mock_comments_service):
    data = {
        "postId": "post1",
        "userId": "user1",
        "text": "Updated comment",
        "likes": 5,
        "parentId": None,
        "date": "2025-05-16"
    }
    response = client.put("/comm1", json=data)
    assert response.status_code == 200
    assert response.json() == {"message": "updated"}

def test_delete_comment_success(mock_comments_service):
    response = client.delete("/comm1")
    assert response.status_code == 200
    assert response.json() == {"message": "deleted"}

def test_get_comments_by_post_id_success(mock_comments_service):
    response = client.get("/post/post1")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_delete_post_and_comments_success(mock_comments_service):
    response = client.delete("/post/post1")
    assert response.status_code == 200
    assert response.json() == {"message": "post and comments deleted"}

def test_get_comment_tree_success(mock_comments_service):
    response = client.get("/post/post1/comment/comm1")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_user_comments_success(mock_comments_service):
    response = client.get("/user/user1")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

