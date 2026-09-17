"""
Test for annotation template API endpoints.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


async def get_auth_token(client: AsyncClient, username: str = "tpltest") -> str:
    """Helper: get auth token by registering and logging in."""
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
async def test_create_template():
    """Test creating an annotation template."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "tplcreate")

        response = await client.post(
            "/api/annotations/templates",
            json={
                "name": "发动机异响",
                "part_name": "发动机",
                "noise_type": "哒哒声"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "发动机异响"
        assert data["part_name"] == "发动机"
        assert data["noise_type"] == "哒哒声"
        assert "id" in data
        assert "created_at" in data


@pytest.mark.asyncio
async def test_list_templates():
    """Test listing annotation templates."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "tpllist")

        # First create a template
        await client.post(
            "/api/annotations/templates",
            json={"name": "test template", "speed": 60},
            headers={"Authorization": f"Bearer {token}"}
        )

        # Then list
        response = await client.get(
            "/api/annotations/templates",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        assert len(response.json()) >= 1


@pytest.mark.asyncio
async def test_delete_template():
    """Test deleting an annotation template."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "tpldel")

        # Create
        create_resp = await client.post(
            "/api/annotations/templates",
            json={"name": "to delete"},
            headers={"Authorization": f"Bearer {token}"}
        )
        template_id = create_resp.json()["id"]

        # Delete
        del_resp = await client.delete(
            f"/api/annotations/templates/{template_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert del_resp.status_code == 200

        # Verify deleted
        list_resp = await client.get(
            "/api/annotations/templates",
            headers={"Authorization": f"Bearer {token}"}
        )
        template_ids = [t["id"] for t in list_resp.json()]
        assert template_id not in template_ids


@pytest.mark.asyncio
async def test_delete_template_not_found():
    """Test deleting a non-existent template returns 404."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "tplnotfound")

        response = await client.delete(
            "/api/annotations/templates/nonexistent-id",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 404


@pytest.mark.asyncio
async def test_template_requires_auth():
    """Test template endpoints require authentication."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create without auth
        response = await client.post(
            "/api/annotations/templates",
            json={"name": "test"}
        )
        assert response.status_code == 401

        # List without auth
        response = await client.get("/api/annotations/templates")
        assert response.status_code == 401
