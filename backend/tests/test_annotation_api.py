"""
Test for annotation API endpoints.
"""

import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import Base, engine


async def get_auth_token(client: AsyncClient, username: str = "annottest") -> str:
    """Helper: get auth token by registering and logging in."""
    # Register
    await client.post("/api/auth/register", json={
        "username": username,
        "email": f"{username}@test.com",
        "password": "testpass123"
    })
    # Login
    resp = await client.post("/api/auth/login",
        data={"username": username, "password": "testpass123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"})
    return resp.json()["access_token"]


@pytest.mark.asyncio
async def test_batch_submit_empty_list():
    """Test batch submit with empty list returns success with 0 count."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "batchempty")

        response = await client.post(
            "/api/annotations/batch-submit",
            json={"annotation_ids": []},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert response.json()["message"] == "已提交 0 条标注"


@pytest.mark.asyncio
async def test_batch_submit_nonexistent_annotations():
    """Test batch submit with non-existent annotation IDs returns success (idempotent)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "batchnonexist")

        fake_ids = [str(uuid.uuid4()) for _ in range(3)]
        response = await client.post(
            "/api/annotations/batch-submit",
            json={"annotation_ids": fake_ids},
            headers={"Authorization": f"Bearer {token}"}
        )
        # Should succeed but report 0 submitted (no matching annotations found)
        assert response.status_code == 200
        assert response.json()["message"] == "已提交 0 条标注"


@pytest.mark.asyncio
async def test_batch_submit_requires_auth():
    """Test batch submit requires authentication."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/annotations/batch-submit",
            json={"annotation_ids": []}
        )
        assert response.status_code == 401
