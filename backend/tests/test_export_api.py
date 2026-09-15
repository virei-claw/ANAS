"""
Test for export API endpoints.
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
async def test_export_csv_requires_auth():
    """Test CSV export requires auth."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/export/annotations/csv")
        assert response.status_code == 401

@pytest.mark.asyncio
async def test_export_json_requires_auth():
    """Test JSON export requires auth."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/export/annotations/json")
        assert response.status_code == 401

@pytest.mark.asyncio
async def test_export_json_with_auth():
    """Test JSON export with auth."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "exporttest1")
        response = await client.get("/api/export/annotations/json",
            headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        assert isinstance(response.json(), list)
