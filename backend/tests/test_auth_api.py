"""
Test for auth API endpoints.
Following TDD: RED first, then GREEN.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_register_success():
    """Test successful user registration."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 使用唯一用户名避免冲突
        import time
        username = f"testuser_{int(time.time())}"
        response = await client.post("/api/auth/register", json={
            "username": username,
            "email": f"{username}@test.com",
            "password": "testpassword123",
            "full_name": "Test User"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == username
        assert data["email"] == f"{username}@test.com"
        assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_username():
    """Test registration with duplicate username fails."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 先注册一个用户
        response = await client.post("/api/auth/register", json={
            "username": "duplicate_user",
            "email": "duplicate@test.com",
            "password": "testpassword123"
        })
        # 再次注册相同用户名应该失败
        response2 = await client.post("/api/auth/register", json={
            "username": "duplicate_user",
            "email": "another@test.com",
            "password": "testpassword123"
        })
        assert response2.status_code == 400
        assert "用户名已存在" in response2.json()["detail"]


@pytest.mark.asyncio
async def test_login_success():
    """Test successful login."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 先注册
        import time
        username = f"logintest_{int(time.time())}"
        await client.post("/api/auth/register", json={
            "username": username,
            "email": f"{username}@test.com",
            "password": "testpassword123"
        })
        # 登录
        response = await client.post(
            "/api/auth/login",
            data={
                "username": username,
                "password": "testpassword123"
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data


@pytest.mark.asyncio
async def test_login_wrong_password():
    """Test login with wrong password fails."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        import time
        username = f"wrongpw_{int(time.time())}"
        # 先注册
        await client.post("/api/auth/register", json={
            "username": username,
            "email": f"{username}@test.com",
            "password": "correct_password"
        })
        # 用错误密码登录
        response = await client.post(
            "/api/auth/login",
            data={
                "username": username,
                "password": "wrong_password"
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user():
    """Test login with nonexistent user fails."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/auth/login",
            data={
                "username": "nonexistent_user_12345",
                "password": "anypassword"
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_without_token():
    """Test getting current user without token returns 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/auth/me")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_with_token():
    """Test getting current user with valid token."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        import time
        username = f"me_test_{int(time.time())}"
        # 注册并登录
        await client.post("/api/auth/register", json={
            "username": username,
            "email": f"{username}@test.com",
            "password": "testpassword123"
        })
        login_resp = await client.post(
            "/api/auth/login",
            data={"username": username, "password": "testpassword123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        token = login_resp.json()["access_token"]

        # 获取当前用户
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == username


@pytest.mark.asyncio
async def test_logout():
    """Test logout endpoint."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        import time
        username = f"logout_test_{int(time.time())}"
        # 注册并登录
        await client.post("/api/auth/register", json={
            "username": username,
            "email": f"{username}@test.com",
            "password": "testpassword123"
        })
        login_resp = await client.post(
            "/api/auth/login",
            data={"username": username, "password": "testpassword123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        token = login_resp.json()["access_token"]

        # 登出
        response = await client.post(
            "/api/auth/logout",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert "登出成功" in response.json()["message"]
