"""
Test for project API endpoints.
"""

import pytest
from httpx import AsyncClient, ASGITransport
# Import models to register tables with Base.metadata
from app.models import Project  # noqa: F401
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
async def test_list_projects_requires_auth():
    """Test listing projects requires auth."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/projects")
        assert response.status_code == 401

@pytest.mark.asyncio
async def test_list_projects_with_auth():
    """Test listing projects with auth."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "projtest1")
        response = await client.get("/api/projects",
            headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200

@pytest.mark.asyncio
async def test_create_project():
    """Test creating a project."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "projtest2")
        response = await client.post("/api/projects",
            json={"name": "Test Project", "description": "A test project"},
            headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Project"
        assert data["description"] == "A test project"
        assert "id" in data

@pytest.mark.asyncio
async def test_delete_project():
    """Test deleting a project."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "projtest3")
        # Create first
        create_resp = await client.post("/api/projects",
            json={"name": "To Delete"},
            headers={"Authorization": f"Bearer {token}"})
        project_id = create_resp.json()["id"]
        # Delete
        del_resp = await client.delete(f"/api/projects/{project_id}",
            headers={"Authorization": f"Bearer {token}"})
        assert del_resp.status_code == 200
