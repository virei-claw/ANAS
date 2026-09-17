"""
Test for stats API endpoints.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


async def get_auth_token(client: AsyncClient, username: str) -> str:
    await client.post("/api/auth/register", json={
        "username": username,
        "email": f"{username}@test.com",
        "password": "testpass123"
    })
    resp = await client.post("/api/auth/login",
        data={"username": username, "password": "testpass123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"})
    return resp.json()["access_token"]


@pytest.mark.asyncio
async def test_stats_requires_auth():
    """Test stats endpoint requires auth."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/stats/dashboard")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_stats_with_auth():
    """Test stats endpoint with auth returns data structure."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "statstest1")
        response = await client.get("/api/stats/dashboard",
            headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        # Verify data structure
        assert "total_audios" in data
        assert "total_annotations" in data
        assert "today_annotations" in data
        assert "active_users" in data
        assert "status_counts" in data
        assert "noise_type_stats" in data
        assert "part_stats" in data
        assert "daily_trend" in data


@pytest.mark.asyncio
async def test_user_workload_stats_requires_auth():
    """Test user workload endpoint requires auth."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/stats/user-workload")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_user_workload_stats_with_auth():
    """Test user workload endpoint returns per-user annotation counts."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create two users
        token1 = await get_auth_token(client, "workloaduser1")
        token2 = await get_auth_token(client, "workloaduser2")

        # Get stats for all users
        response = await client.get("/api/stats/user-workload",
            headers={"Authorization": f"Bearer {token1}"})
        assert response.status_code == 200
        data = response.json()

        # Verify response is a list
        assert isinstance(data, list)
        # Each item should have user_id, username, full_name, count
        for item in data:
            assert "user_id" in item
            assert "username" in item
            assert "full_name" in item
            assert "count" in item


@pytest.mark.asyncio
async def test_my_workload_requires_auth():
    """Test my-workload endpoint requires auth."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/stats/my-workload")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_my_workload_with_auth():
    """Test my-workload endpoint returns pending/reviewing/completed counts."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "myworkloaduser")
        response = await client.get("/api/stats/my-workload",
            headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        # Verify response structure
        assert "pending" in data
        assert "reviewing" in data
        assert "completed" in data
        # Verify all values are integers
        assert isinstance(data["pending"], int)
        assert isinstance(data["reviewing"], int)
        assert isinstance(data["completed"], int)


@pytest.mark.asyncio
async def test_my_summary_requires_auth():
    """Test my-summary endpoint requires auth."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/stats/my-summary")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_my_summary_with_auth():
    """Test my-summary endpoint returns personal annotation summary with period filter."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "summaryuser")
        # Test default period (week)
        response = await client.get("/api/stats/my-summary",
            headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        # Verify response structure
        assert "total_count" in data
        assert "by_status" in data
        # Verify by_status has expected keys
        assert "draft" in data["by_status"]
        assert "submitted" in data["by_status"]
        assert "approved" in data["by_status"]
        assert "rejected" in data["by_status"]


@pytest.mark.asyncio
async def test_my_summary_period_filter():
    """Test my-summary endpoint supports day/week/month period filter."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "summaryuser2")
        # Test day period
        response = await client.get("/api/stats/my-summary?period=day",
            headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert "total_count" in data
        assert "by_status" in data

        # Test week period
        response = await client.get("/api/stats/my-summary?period=week",
            headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200

        # Test month period
        response = await client.get("/api/stats/my-summary?period=month",
            headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
