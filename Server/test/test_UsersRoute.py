import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from Model.UserPydantic import UserPydantic

with patch("firebase_admin.initialize_app"), patch("firebase_admin.firestore.client") as mock_firestore_client:
    mock_firestore_client.return_value = AsyncMock()
    from Routes.Data.User import router

client = TestClient(router)
@pytest.fixture
def user_pydantic():
    return UserPydantic(
        id="user1",
        name="Test User",
        email="test@example.com",
        bio="Sample bio",
        postRatings=4.5,
        commentsLikes=3.7,
        followers=[],
        following=[]
    )
@pytest.fixture(autouse=True)
def mock_users_service():
    with patch("Routes.Data.User.users_service") as mock_service:
        mock_service.get_all_users = AsyncMock(return_value=[{"id": "user1"}])
        mock_service.get_user_by_id = AsyncMock(return_value={"id": "user1"})
        mock_service.update_user = AsyncMock(return_value={"id": "user1"})
        mock_service.delete_user = AsyncMock(return_value={"message": "User and related data deleted successfully"})
        mock_service.follow_user = AsyncMock(return_value={"message": "Now following user2"})
        mock_service.unfollow_user = AsyncMock(return_value={"message": "Unfollowing user2"})
        mock_service.add_follower = AsyncMock(return_value={"message": "Follower added"})
        mock_service.remove_follower = AsyncMock(return_value={"message": "Follower removed"})
        yield mock_service

def test_get_all_users_success(mock_users_service):
    response = client.get("/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert response.json()[0]["id"] == "user1"

def test_get_user_success(mock_users_service):
    response = client.get("/user1")
    assert response.status_code == 200
    assert response.json()["id"] == "user1"

def test_update_user_success(mock_users_service, user_pydantic):
    response = client.put("/user1", json=user_pydantic.dict())
    assert response.status_code == 200
    assert response.json()["id"] == "user1"

def test_delete_user_success(mock_users_service):
    response = client.delete("/user1")
    assert response.status_code == 200
    assert response.json()["message"] == "User and related data deleted successfully"

def test_follow_user_success(mock_users_service):
    response = client.post("/user1/follow/user2")
    assert response.status_code == 200
    assert "following" in response.json()["message"].lower()

def test_unfollow_user_success(mock_users_service):
    response = client.post("/user1/unfollow/user2")
    assert response.status_code == 200
    assert "unfollowing" in response.json()["message"].lower()

def test_add_follower_success(mock_users_service):
    response = client.post("/user1/add_follower/user2")
    assert response.status_code == 200
    assert response.json()["message"] == "Follower added"

def test_remove_follower_success(mock_users_service):
    response = client.post("/user1/remove_follower/user2")
    assert response.status_code == 200
    assert response.json()["message"] == "Follower removed"

