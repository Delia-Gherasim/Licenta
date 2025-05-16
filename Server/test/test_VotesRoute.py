import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from Model.VotesPydanctic import VoteRequest, VoteDeleteRequest, CommentIdRequest

with patch("firebase_admin.initialize_app"), patch("firebase_admin.firestore.client"):
    from Routes.Data.Votes import router

client = TestClient(router, raise_server_exceptions=False)

@pytest.fixture
def mock_votes_service():
    with patch("Routes.Data.Votes.votes_service") as mock_service:
        mock_service.get_votes_for_comment = AsyncMock(return_value=[{"userId": "user1", "vote": True}])
        mock_service.get_total_votes_for_comment = AsyncMock(return_value={"totalVotes": 10})
        mock_service.get_user_vote_for_comment = AsyncMock(return_value={"vote": True})
        mock_service.vote_on_comment = AsyncMock(return_value={"message": "vote registered"})
        mock_service.remove_vote = AsyncMock(return_value={"message": "vote removed"})
        mock_service.remove_all_votes = AsyncMock(return_value={"message": "all votes removed"})
        yield mock_service

def test_get_votes_for_comment_success(mock_votes_service):
    response = client.get("/comment1", params={"userId": "user1"})
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_total_votes_for_comment_success(mock_votes_service):
    response = client.get("/comment1/total", params={"userId": "user1"})
    assert response.status_code == 200
    assert "totalVotes" in response.json()

def test_get_user_vote_for_comment_success(mock_votes_service):
    response = client.get("/comment1/user/user1")
    assert response.status_code == 200
    assert "vote" in response.json()

def test_vote_on_comment_success(mock_votes_service):
    data = {"commentId": "comment1", "userId": "user1", "vote": True}
    response = client.post("/vote", json=data)
    assert response.status_code == 200
    assert "vote registered" in response.json()["message"]

def test_remove_vote_success(mock_votes_service):
    data = {"commentId": "comment1", "userId": "user1"}
    response = client.request("DELETE", "/remove", json=data)
    assert response.status_code == 200
    assert "vote removed" in response.json()["message"]

def test_remove_all_votes_success(mock_votes_service):
    data = {"commentId": "comment1"}
    response = client.request("DELETE", "/remove_all", json=data)
    assert response.status_code == 200
    assert "all votes removed" in response.json()["message"]

