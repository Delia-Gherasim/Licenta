import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from Repository.RatingsRepository import RatingsRepository

async def async_generator(items):
    for item in items:
        yield item

@pytest.fixture
def repo():
    with patch("Repository.RatingsRepository.FirebaseSingleton") as MockFirebase:
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.collection.return_value = mock_collection
        MockFirebase.return_value.get_firestore_client.return_value = mock_db
        repository = RatingsRepository("fake_path")
        yield repository

@pytest.mark.asyncio
async def test_get_rating_document_exists(repo):
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.id = "post1_user1"
    repo.db.collection.return_value.document.return_value.get = AsyncMock(return_value=mock_doc)

    res = await repo._get_rating_document("post1", "user1")
    assert res == mock_doc

@pytest.mark.asyncio
async def test_calculate_average_rating(repo):
    mock_rating1 = MagicMock()
    mock_rating1.to_dict.return_value = {"rating": 4}
    mock_rating1.id = "r1"
    mock_rating2 = MagicMock()
    mock_rating2.to_dict.return_value = {"rating": 2}
    mock_rating2.id = "r2"

    repo.db.collection.return_value.where.return_value.stream = AsyncMock(
        side_effect=lambda: async_generator([mock_rating1, mock_rating2])
    )

    with patch("Repository.RatingsRepository.run_in_threadpool", new=lambda func, *args, **kwargs: func(*args, **kwargs)):
        avg = await repo.calculate_average_rating("post1")

    assert avg == 3.0

@pytest.mark.asyncio
async def test_calculate_average_rating_empty(repo):
    repo.db.collection.return_value.where.return_value.stream = AsyncMock(
        side_effect=lambda: async_generator([])
    )
    with patch("Repository.RatingsRepository.run_in_threadpool", new=lambda func, *args, **kwargs: func(*args, **kwargs)):
        avg = await repo.calculate_average_rating("post1")
    assert avg == 0.0

@pytest.mark.asyncio
async def test_upload_or_update_rating_create_new(repo):
    mock_doc = MagicMock()
    mock_doc.exists = False
    mock_doc.reference.set = AsyncMock()
    repo._get_rating_document = AsyncMock(return_value=mock_doc)
    with patch("Repository.RatingsRepository.run_in_threadpool", new=lambda func, *args, **kwargs: func(*args, **kwargs)):
        result = await repo.upload_or_update_rating("post1", "user1", 5)
    assert result == {"message": "Rating created", "isNew": True}

@pytest.mark.asyncio
async def test_upload_or_update_rating_update_existing(repo):
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {"rating": 3}
    mock_doc.reference.update = AsyncMock()
    repo._get_rating_document = AsyncMock(return_value=mock_doc)
    with patch("Repository.RatingsRepository.run_in_threadpool", new=lambda func, *args, **kwargs: func(*args, **kwargs)):
        result = await repo.upload_or_update_rating("post1", "user1", 4)
    assert result == {"message": "Rating updated", "oldRating": 3, "isNew": False}

@pytest.mark.asyncio
async def test_upload_or_update_rating_invalid_rating(repo):
    result = await repo.upload_or_update_rating("post1", "user1", 6)
    assert result == {"error": "Rating must be between 1 and 5"}

@pytest.mark.asyncio
async def test_get_post_ratings_success(repo):
    mock_rating = MagicMock()
    mock_rating.id = "rating123"
    mock_rating.to_dict.return_value = {"rating": 5, "postId": "post1", "userId": "user1"}

    repo.db.collection.return_value.where.return_value.stream = AsyncMock(
        side_effect=lambda: async_generator([mock_rating])
    )

    with patch("Repository.RatingsRepository.run_in_threadpool", new=lambda func, *args, **kwargs: func(*args, **kwargs)):
        result = await repo.get_post_ratings("post1")

    assert result == [{"ratingId": "rating123", "rating": 5, "postId": "post1", "userId": "user1"}]

@pytest.mark.asyncio
async def test_get_post_average_rating_calls_calculate(repo):
    with patch.object(repo, "calculate_average_rating", new=AsyncMock(return_value=4.5)):
        avg = await repo.get_post_average_rating("post1")
    assert avg == 4.5

@pytest.mark.asyncio
async def test_delete_rating_exists(repo):
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.reference.delete = AsyncMock()
    repo._get_rating_document = AsyncMock(return_value=mock_doc)
    with patch("Repository.RatingsRepository.run_in_threadpool", new=lambda func, *args, **kwargs: func(*args, **kwargs)):
        result = await repo.delete_rating("post1", "user1")
    assert result == {"message": "Rating deleted"}

@pytest.mark.asyncio
async def test_delete_rating_not_found(repo):
    mock_doc = MagicMock()
    mock_doc.exists = False
    repo._get_rating_document = AsyncMock(return_value=mock_doc)
    result = await repo.delete_rating("post1", "user1")
    assert result == {"error": "Rating not found"}

@pytest.mark.asyncio
async def test_delete_all_ratings_success(repo):
    mock_rating1 = MagicMock()
    mock_rating1.reference.delete = AsyncMock()
    mock_rating2 = MagicMock()
    mock_rating2.reference.delete = AsyncMock()

    repo.db.collection.return_value.where.return_value.stream = AsyncMock(
        side_effect=lambda: async_generator([mock_rating1, mock_rating2])
    )

    with patch("Repository.RatingsRepository.run_in_threadpool", new=lambda func, *args, **kwargs: func(*args, **kwargs)):
        result = await repo.delete_all_ratings("post1")

    assert result == {"message": "All ratings for post post1 deleted"}

@pytest.mark.asyncio
async def test_delete_all_ratings_no_ratings(repo):
    repo.db.collection.return_value.where.return_value.stream = AsyncMock(
        side_effect=lambda: async_generator([])
    )
    with patch("Repository.RatingsRepository.run_in_threadpool", new=lambda func, *args, **kwargs: func(*args, **kwargs)):
        result = await repo.delete_all_ratings("post1")
    assert result == {"message": "No ratings found for post post1"}

@pytest.mark.asyncio
async def test_get_rating_exists(repo):
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {"rating": 3}
    repo._get_rating_document = AsyncMock(return_value=mock_doc)
    result = await repo.get_rating("post1", "user1")
    assert result == 3

@pytest.mark.asyncio
async def test_get_rating_not_found(repo):
    mock_doc = MagicMock()
    mock_doc.exists = False
    repo._get_rating_document = AsyncMock(return_value=mock_doc)
    result = await repo.get_rating("post1", "user1")
    assert result == {"message": "Rating not found"}
