import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from Repository.VotesRepository import VotesRepository

@pytest.fixture
def repo():
    with patch("Repository.VotesRepository.FirebaseSingleton") as MockFirebase:
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.collection.return_value = mock_collection
        MockFirebase.return_value.get_firestore_client.return_value = mock_db
        repository = VotesRepository("fake_path")
        return repository

@pytest.mark.asyncio
async def test_calculate_total_votes(repo):
    mock_vote1 = MagicMock()
    mock_vote1.to_dict.return_value = {"vote": True}
    mock_vote2 = MagicMock()
    mock_vote2.to_dict.return_value = {"vote": False}
    repo.db.collection.return_value.where.return_value.stream = MagicMock(return_value=[mock_vote1, mock_vote2])

    total = await repo.calculate_total_votes("comm1")
    assert total == 0 

@pytest.mark.asyncio
async def test_upload_new_vote(repo):
    mock_doc = MagicMock()
    mock_doc.exists = False
    repo.db.collection.return_value.document.return_value.get = MagicMock(return_value=mock_doc)
    repo.db.collection.return_value.document.return_value.set = AsyncMock()
    repo.db.collection.return_value.document.return_value.update = AsyncMock()

    res = await repo.upload_or_update_vote("comm1", "user1", True)
    assert res == {"message": "Vote uploaded"}


@pytest.mark.asyncio
async def test_update_vote(repo):
    mock_doc = MagicMock()
    mock_doc.exists = True
    repo.db.collection.return_value.document.return_value.get = MagicMock(return_value=mock_doc)
    repo.db.collection.return_value.document.return_value.update = AsyncMock()
    repo.db.collection.return_value.document.return_value.set = AsyncMock()

    res = await repo.upload_or_update_vote("comm1", "user1", False)
    assert res == {"message": "Vote updated"}


@pytest.mark.asyncio
async def test_get_comment_votes(repo):
    mock_vote1 = MagicMock()
    mock_vote1.to_dict.return_value = {"vote": True, "userId": "user1"}
    mock_vote1.id = "vote1"
    mock_vote2 = MagicMock()
    mock_vote2.to_dict.return_value = {"vote": False, "userId": "user2"}
    mock_vote2.id = "vote2"

    repo.db.collection.return_value.where.return_value.stream = MagicMock(return_value=[mock_vote1, mock_vote2])

    votes = await repo.get_comment_votes("comm1")
    assert len(votes) == 2
    assert votes[0]["voteId"] == "vote1"
    assert votes[1]["voteId"] == "vote2"

@pytest.mark.asyncio
async def test_get_comment_total_votes(repo):
    repo.calculate_total_votes = AsyncMock(return_value=5)
    result = await repo.get_comment_total_votes("comm1")
    assert result == {"commId": "comm1", "totalVotes": 5}
    repo.calculate_total_votes.assert_awaited_once_with("comm1")

@pytest.mark.asyncio
async def test_delete_vote(repo):
    doc_mock = repo.db.collection.return_value.document.return_value
    doc_mock.delete = AsyncMock()

    res = await repo.delete_vote("comm1", "user1")
    assert res == {"message": "Vote deleted"}

@pytest.mark.asyncio
async def test_delete_all_votes(repo):
    mock_vote1 = MagicMock()
    mock_vote2 = MagicMock()
    mock_vote1.reference = MagicMock()
    mock_vote2.reference = MagicMock()
    async def async_gen():
        yield mock_vote1
        yield mock_vote2
    repo.db.collection.return_value.where.return_value.stream = MagicMock(return_value=[mock_vote1, mock_vote2])

    batch_mock = MagicMock()
    batch_mock.delete = MagicMock()
    batch_mock.commit = AsyncMock()
    repo.db.batch.return_value = batch_mock

    res = await repo.delete_all_votes("comm1")
    assert res == {"message": "All votes for comment comm1 deleted"}
    batch_mock.delete.assert_any_call(mock_vote1.reference)
    batch_mock.delete.assert_any_call(mock_vote2.reference)


@pytest.mark.asyncio
async def test_get_user_vote_exists(repo):
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {"userId": "user1", "vote": True}
    repo.db.collection.return_value.document.return_value.get = MagicMock(return_value=mock_doc)

    res = await repo.get_user_vote("comm1", "user1")
    assert res == {"userId": "user1", "vote": True}

@pytest.mark.asyncio
async def test_get_user_vote_not_exists(repo):
    mock_doc = MagicMock()
    mock_doc.exists = False
    repo.db.collection.return_value.document.return_value.get = MagicMock(return_value=mock_doc)

    res = await repo.get_user_vote("comm1", "user1")
    assert res == {"userId": "user1", "vote": None}