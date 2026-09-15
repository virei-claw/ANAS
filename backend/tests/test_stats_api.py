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
