import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from Repository.UsersRepository import UsersRepository
from Model.User import User

@pytest.fixture
def fake_user():
    return User(
        id="user123",
        name="Test User",
        email="test@example.com",
        bio="Bio text",
        postRatings=0, 
        commentsLikes=0, 
        followers=None, 
        following=None
    )

@pytest.fixture
def repo():
    with patch("Repository.UsersRepository.FirebaseSingleton") as MockFirebase:
        mock_db = MagicMock()
        mock_collection = MagicMock()
        mock_db.collection.return_value = mock_collection
        MockFirebase.return_value.get_firestore_client.return_value = mock_db
        repository = UsersRepository("fake_path")
        return repository

@pytest.mark.asyncio
async def test__get_user_doc_exists(repo):
    mock_doc = MagicMock()
    mock_doc.exists = True
    repo.db.collection.return_value.document.return_value.get = AsyncMock(return_value=mock_doc)
    res = await repo._get_user_doc("user1") 
    assert res == mock_doc


@pytest.mark.asyncio
async def test_update_user_success(repo, fake_user):
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.reference.update = AsyncMock()

    repo._get_user_doc = AsyncMock(return_value=mock_doc)
    fake_user.name = "New Name" 
    fake_user.email = "newemail@example.com"
    fake_user.bio = "Updated bio" 

    result = await repo.update_user("user1", fake_user)
    assert result == {"message": "User updated"}


@pytest.mark.asyncio
async def test_update_user_not_found(repo, fake_user):
    mock_doc = MagicMock()
    mock_doc.exists = False
    repo._get_user_doc = AsyncMock(return_value=mock_doc)

    result = await repo.update_user("user1", fake_user)
    assert result == {"error": "User not found"}

@pytest.mark.asyncio
async def test__update_followers_or_following_add_follow(repo):
    uId = "user1"
    userId = "user2"
    user_field = "following"

    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {user_field: []}  
    mock_doc.reference.update = AsyncMock()
    repo._get_user_doc = AsyncMock(return_value=mock_doc)

    repo.get_all_users = AsyncMock(return_value=[{"userId": "user2"}, {"userId": "user3"}])

    result = await repo._update_followers_or_following(uId, user_field, userId, True)
    assert result == {"message": f"Now {user_field[:-1]} {userId}"}

@pytest.mark.asyncio
async def test__update_followers_or_following_remove_follower(repo):
    uId = "user1"
    userId = "user2"
    user_field = "followers"

    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {user_field: [userId]}
    mock_doc.reference.update = AsyncMock()
    repo._get_user_doc = AsyncMock(return_value=mock_doc)
    repo.get_all_users = AsyncMock(return_value=[{"userId": userId}])

    result = await repo._update_followers_or_following(uId, user_field, userId, False)
    assert result == {"message": f"Un{user_field[:-1]} {userId}"}

@pytest.mark.asyncio
async def test__update_followers_or_following_user_not_exist(repo):
    repo.get_all_users = AsyncMock(return_value=[{"userId": "userX"}])
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {"followers": []}
    repo._get_user_doc = AsyncMock(return_value=mock_doc)

    result = await repo._update_followers_or_following("user1", "followers", "nonexistent", True)
    assert result == {"error": "User 'nonexistent' does not exist"}

@pytest.mark.asyncio
async def test__update_followers_or_following_user_not_found(repo):
    mock_doc = MagicMock()
    mock_doc.exists = False
    repo._get_user_doc = AsyncMock(return_value=mock_doc)

    result = await repo._update_followers_or_following("user1", "followers", "user2", True)
    assert result == {"error": "User not found"}

@pytest.mark.asyncio
async def test_follow_update_calls_update_following(repo):
    repo._update_followers_or_following = AsyncMock(return_value={"message": "ok"})
    result = await repo.follow_update("user1", "user2", True)
    assert result == {"message": "ok"}

@pytest.mark.asyncio
async def test_follower_update_calls_update_followers(repo):
    repo._update_followers_or_following = AsyncMock(return_value={"message": "ok"})
    result = await repo.follower_update("user1", "user2", True)
    assert result == {"message": "ok"}

@pytest.mark.asyncio
async def test_update_user_rating_success(repo):
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.reference.update = AsyncMock()
    repo._get_user_doc = AsyncMock(return_value=mock_doc)

    result = await repo.update_user_rating("user1", 4.5)
    assert result == {"message": "User rating updated"}

@pytest.mark.asyncio
async def test_update_user_rating_not_found(repo):
    mock_doc = MagicMock()
    mock_doc.exists = False
    repo._get_user_doc = AsyncMock(return_value=mock_doc)

    result = await repo.update_user_rating("user1", 4.5)
    assert result == {"error": "User not found"}

@pytest.mark.asyncio
async def test_update_user_votes_success(repo):
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {"commentsRating": 3}
    mock_doc.reference.update = AsyncMock()
    repo._get_user_doc = AsyncMock(return_value=mock_doc)

    result = await repo.update_user_votes("user1", True)
    assert result == {"message": "User votes updated"}
    
@pytest.mark.asyncio
async def test_update_user_votes_invalid_type(repo):
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {"commentsRating": "bad_data"}
    repo._get_user_doc = AsyncMock(return_value=mock_doc)

    result = await repo.update_user_votes("user1", True)
    assert result == {"error": "Invalid data type for commentsRating"}

@pytest.mark.asyncio
async def test_update_user_votes_user_not_found(repo):
    mock_doc = MagicMock()
    mock_doc.exists = False
    repo._get_user_doc = AsyncMock(return_value=mock_doc)

    result = await repo.update_user_votes("user1", True)
    assert result == {"error": "User not found"}

@pytest.mark.asyncio
async def test_update_user_likes_success(repo):
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.reference.update = AsyncMock()
    repo._get_user_doc = AsyncMock(return_value=mock_doc)

    result = await repo.update_user_likes("user1", 10)
    assert result == {"message": "User total likes updated"}

@pytest.mark.asyncio
async def test_update_user_likes_not_found(repo):
    mock_doc = MagicMock()
    mock_doc.exists = False
    repo._get_user_doc = AsyncMock(return_value=mock_doc)

    result = await repo.update_user_likes("user1", 10)
    assert result == {"error": "User not found"}

@pytest.mark.asyncio
async def test_get_user_by_id_found(repo):
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.id = "user1"
    mock_doc.to_dict.return_value = {"name": "name"}
    repo._get_user_doc = AsyncMock(return_value=mock_doc)

    result = await repo.get_user_by_id("user1")
    assert result["userId"] == "user1"
    assert result["name"] == "name"

@pytest.mark.asyncio
async def test_get_user_by_id_not_found(repo):
    mock_doc = MagicMock()
    mock_doc.exists = False
    repo._get_user_doc = AsyncMock(return_value=mock_doc)

    result = await repo.get_user_by_id("user1")
    assert result == {"error": "User not found"}

@pytest.mark.asyncio
async def test_get_all_users(repo):
    mock_user1 = MagicMock()
    mock_user1.id = "user1"
    mock_user1.to_dict.return_value = {"name": "User1"}
    mock_user2 = MagicMock()
    mock_user2.id = "user2"
    mock_user2.to_dict.return_value = {"name": "User2"}

    repo.db.collection.return_value.stream = MagicMock(return_value=[mock_user1, mock_user2])

    result = await repo.get_all_users()
    assert {"userId": "user1", "name": "User1"} in result
    assert {"userId": "user2", "name": "User2"} in result

@pytest.mark.asyncio
async def test_delete_user_success(repo):
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.reference.delete = AsyncMock()
    repo._get_user_doc = AsyncMock(return_value=mock_doc)

    result = await repo.delete_user("user1")
    assert result == {"message": "User and all associated posts deleted"}

@pytest.mark.asyncio
async def test_delete_user_not_found(repo):
    mock_doc = MagicMock()
    mock_doc.exists = False
    repo._get_user_doc = AsyncMock(return_value=mock_doc)

    result = await repo.delete_user("user1")
    assert result == {"error": "User not found"}
