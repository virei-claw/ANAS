"""
Test for webhook API endpoints.
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
async def test_webhook_test_requires_auth():
    """Test webhook test endpoint requires auth."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/webhooks/test?url=https://example.com")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_webhook_trigger_requires_auth():
    """Test webhook trigger requires auth."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/webhooks/trigger/project-123",
            json={"event": "test", "data": {}}
        )
        assert response.status_code == 401
