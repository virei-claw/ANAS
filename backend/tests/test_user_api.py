"""
Test for user API endpoints.
Following TDD: RED first, then GREEN.
"""

import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app


async def get_admin_token():
    """Helper: get admin token for permission-required tests."""
    from app.database import SessionLocal
    from app.models.user import User, Role
    from app.core.security import get_password_hash

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Use UUID to ensure unique username
        unique_id = str(uuid.uuid4())[:8]
        username = f"admin_{unique_id}"
        email = f"{username}@test.com"

        # Create admin user directly in DB with admin role
        db = SessionLocal()
        try:
            # Create user
            user = User(
                id=str(uuid.uuid4()),
                username=username,
                email=email,
                password_hash=get_password_hash("adminpassword123"),
                full_name="Admin User"
            )
            # Get admin role
            admin_role = db.query(Role).filter(Role.name == "admin").first()
            if admin_role:
                user.roles.append(admin_role)
            db.add(user)
            db.commit()
            db.refresh(user)
        finally:
            db.close()

        # Get token via login
        login_resp = await client.post(
            "/api/auth/login",
            data={"username": username, "password": "adminpassword123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        return login_resp.json()["access_token"]


async def get_regular_token():
    """Helper: get regular user token (annotator only)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        unique_id = str(uuid.uuid4())[:8]
        username = f"regular_{unique_id}"
        await client.post("/api/auth/register", json={
            "username": username,
            "email": f"{username}@test.com",
            "password": "userpassword123",
            "full_name": "Regular User"
        })
        login_resp = await client.post(
            "/api/auth/login",
            data={"username": username, "password": "userpassword123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        return login_resp.json()["access_token"]


@pytest.mark.asyncio
async def test_list_users_requires_auth():
    """Test listing users without auth returns 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/users")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_users_requires_admin():
    """Test listing users with non-admin user returns 403."""
    token = await get_regular_token()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/api/users",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_users_as_admin():
    """Test admin can list users."""
    token = await get_admin_token()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/api/users",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert isinstance(data["items"], list)


@pytest.mark.asyncio
async def test_create_user_as_admin():
    """Test admin can create new user."""
    token = await get_admin_token()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        import time
        username = f"newuser_{int(time.time())}"
        response = await client.post(
            "/api/users",
            json={
                "username": username,
                "email": f"{username}@test.com",
                "password": "newpassword123",
                "full_name": "New User"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == username
        assert data["email"] == f"{username}@test.com"


@pytest.mark.asyncio
async def test_create_user_duplicate_username():
    """Test creating user with duplicate username fails."""
    token = await get_admin_token()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        import time
        username = f"dup_user_{int(time.time())}"
        # Create first user
        await client.post(
            "/api/users",
            json={
                "username": username,
                "email": f"{username}@test.com",
                "password": "password123",
                "full_name": "User One"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        # Try to create duplicate
        response = await client.post(
            "/api/users",
            json={
                "username": username,
                "email": f"different_{username}@test.com",
                "password": "password123",
                "full_name": "User Two"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 400
        assert "用户名已存在" in response.json()["detail"]


@pytest.mark.asyncio
async def test_update_user():
    """Test updating user information."""
    token = await get_admin_token()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        import time
        username = f"updateuser_{int(time.time())}"
        # Create user
        create_resp = await client.post(
            "/api/users",
            json={
                "username": username,
                "email": f"{username}@test.com",
                "password": "password123",
                "full_name": "Original Name"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        user_id = create_resp.json()["id"]

        # Update user
        response = await client.put(
            f"/api/users/{user_id}",
            json={"full_name": "Updated Name", "is_active": False},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == "Updated Name"
        assert data["is_active"] == False


@pytest.mark.asyncio
async def test_delete_user():
    """Test deleting a user."""
    token = await get_admin_token()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        import time
        username = f"deleteuser_{int(time.time())}"
        # Create user
        create_resp = await client.post(
            "/api/users",
            json={
                "username": username,
                "email": f"{username}@test.com",
                "password": "password123",
                "full_name": "Delete Me"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        user_id = create_resp.json()["id"]

        # Delete user
        response = await client.delete(
            f"/api/users/{user_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200

        # Verify user is deleted
        get_resp = await client.get(
            "/api/users",
            headers={"Authorization": f"Bearer {token}"}
        )
        user_ids = [u["id"] for u in get_resp.json()["items"]]
        assert user_id not in user_ids


@pytest.mark.asyncio
async def test_assign_roles_to_user():
    """Test assigning roles to a user."""
    token = await get_admin_token()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        import time
        username = f"roleuser_{int(time.time())}"
        # Create user
        create_resp = await client.post(
            "/api/users",
            json={
                "username": username,
                "email": f"{username}@test.com",
                "password": "password123",
                "full_name": "Role User"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        user_id = create_resp.json()["id"]

        # Assign roles (annotator and viewer)
        response = await client.put(
            f"/api/users/{user_id}/roles",
            json={"role_names": ["annotator", "viewer"]},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        role_names = [r["name"] for r in data["roles"]]
        assert "annotator" in role_names
        assert "viewer" in role_names


@pytest.mark.asyncio
async def test_get_user_by_id():
    """Test getting a specific user by ID."""
    token = await get_admin_token()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        import time
        username = f"getuser_{int(time.time())}"
        # Create user
        create_resp = await client.post(
            "/api/users",
            json={
                "username": username,
                "email": f"{username}@test.com",
                "password": "password123",
                "full_name": "Get Me"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        user_id = create_resp.json()["id"]

        # Get user
        response = await client.get(
            f"/api/users/{user_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == user_id
        assert data["username"] == username


@pytest.mark.asyncio
async def test_get_roles():
    """Test getting all available roles."""
    token = await get_admin_token()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/api/users/roles",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        role_names = [r["name"] for r in data]
        assert "admin" in role_names
        assert "annotator" in role_names
        assert "viewer" in role_names
