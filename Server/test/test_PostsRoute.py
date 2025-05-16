import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from fastapi import status

mock_collection = AsyncMock()
mock_db = AsyncMock()
mock_db.collection.return_value = mock_collection

with patch("firebase_admin.initialize_app"), \
     patch("firebase_admin.firestore.client", return_value=mock_db):
    
    from Routes.Data.Post import router  

client = TestClient(router)

@pytest.fixture
def mock_post_service():
    with patch("Routes.Data.Post.post_service") as mock_service:
        mock_service.add_post = AsyncMock(return_value={"message": "post created"})
        mock_service.get_all_posts = AsyncMock(return_value=[{"id": "p1", "title": "Post 1"}])
        mock_service.update_post = AsyncMock(return_value={"message": "post updated"})
        mock_service.update_post_views = AsyncMock(return_value={"message": "views updated"})
        mock_service.delete_post = AsyncMock(return_value={"message": "post deleted"})
        mock_service.get_post_by_id = AsyncMock(return_value={"id": "p1", "title": "Post 1"})
        mock_service.get_all_posts_of_user = AsyncMock(return_value=[{"id": "p1"}])
        mock_service.get_all_posts_for_user = AsyncMock(return_value=[{"id": "p2"}])
        mock_service.get_user_by_post = AsyncMock(return_value={"user_id": "user1"})
        mock_service.delete_all_posts_of_user = AsyncMock(return_value={"message": "all posts deleted"})
        yield mock_service

def test_create_post_success(mock_post_service):
    post_data = {
        "user_id": "user1",
        "caption": "Test caption",
        "date": "2025-05-16",
        "rating": 4.5,
        "url": "https://example.com/image.jpg",
        "views": 10,
        "hashtags": ["tag1", "tag2"]
    }
    response = client.post("/", json=post_data)
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"message": "post created"}

def test_create_post_exception(mock_post_service):
    mock_post_service.add_post.side_effect = Exception("fail to create")
    post_data = {
        "user_id": "user2",
        "caption": "Test caption",
        "date": "2025-05-16",
        "rating": 4.5,
        "url": "https://example.com/image.jpg",
        "views": 10,
        "hashtags": ["tag1"]
    }
    response = client.post("/", json=post_data)
    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert "fail to create" in response.json()["detail"]

def test_update_post_success(mock_post_service):
    post_data = {
        "user_id": "user1",
        "caption": "Updated caption",
        "date": "2025-05-16",
        "rating": 3.7,
        "url": "https://example.com/updated.jpg",
        "views": 20,
        "hashtags": ["tag3"]
    }
    response = client.put("/post123", json=post_data)
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"message": "post updated"}


def test_get_all_posts_success(mock_post_service):
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)

def test_update_post_views_success(mock_post_service):
    response = client.put("/view/post123")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"message": "views updated"}

def test_delete_post_success(mock_post_service):
    response = client.delete("/post123/user1")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"message": "post deleted"}

def test_get_post_by_id_success(mock_post_service):
    response = client.get("/post123")
    assert response.status_code == status.HTTP_200_OK
    assert "id" in response.json()

def test_get_all_posts_of_user_success(mock_post_service):
    response = client.get("/all/user1")
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)

def test_delete_all_user_posts_success(mock_post_service):
    response = client.delete("/user/user1/delete")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"message": "all posts deleted"}
