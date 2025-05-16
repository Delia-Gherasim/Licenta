import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from fastapi import status

with patch("firebase_admin.initialize_app"), patch("firebase_admin.firestore.client"):
    with patch("Routes.Data.Rating.rating_service") as mock_rating_service:
        from Routes.Data.Rating import router

client = TestClient(router)

@pytest.fixture
def mock_rating_service():
    mock = patch("Routes.Data.Rating.rating_service").start()
    mock.rate_post = AsyncMock(return_value={"message": "rated"})
    mock.get_ratings_for_post = AsyncMock(return_value=[{"userId": "u1", "rating": 5}])
    mock.get_average_rating_for_post = AsyncMock(return_value=4.5)
    mock.get_user_rating_for_post = AsyncMock(return_value=5)
    mock.remove_rating = AsyncMock(return_value={"message": "rating removed"})
    mock.remove_all_ratings_for_post = AsyncMock(return_value={"message": "all ratings removed"})
    yield mock
    patch.stopall()

def test_rate_post_success(mock_rating_service):
    response = client.post("/post123/user123/4.0")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"message": "rated"}

def test_get_post_ratings_success(mock_rating_service):
    response = client.get("/post123")
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)

def test_get_post_average_rating_success(mock_rating_service):
    response = client.get("/average/post123")
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), float)

def test_get_user_rating_success(mock_rating_service):
    response = client.get("/post123/user123")
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), int)

def test_delete_rating_success(mock_rating_service):
    response = client.delete("/post123/user123")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"message": "rating removed"}

def test_delete_all_ratings_for_post_success(mock_rating_service):
    response = client.delete("/post/post123")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"message": "rating removed"}

