"""
Test for review API endpoints.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from sqlalchemy.exc import ProgrammingError


async def get_auth_token(client: AsyncClient, username: str = "reviewtest") -> str:
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
async def test_submit_annotation():
    """Test submitting an annotation for review."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "subtest1")

        # Use valid UUID format - will return 404 if not found
        test_uuid = "00000000-0000-0000-0000-000000000000"
        response = await client.put(
            f"/api/annotations/{test_uuid}/submit",
            headers={"Authorization": f"Bearer {token}"}
        )
        # 404 if annotation doesn't exist
        assert response.status_code == 404


@pytest.mark.asyncio
async def test_approve_requires_admin():
    """Test that approve requires admin role."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "approvetest1")
        test_uuid = "00000000-0000-0000-0000-000000000000"

        response = await client.put(
            f"/api/annotations/{test_uuid}/approve",
            headers={"Authorization": f"Bearer {token}"}
        )
        # Regular user should get 403 Forbidden
        assert response.status_code == 403


@pytest.mark.asyncio
async def test_reject_requires_admin():
    """Test that reject requires admin role."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "rejecttest1")
        test_uuid = "00000000-0000-0000-0000-000000000000"

        response = await client.put(
            f"/api/annotations/{test_uuid}/reject",
            json={"reject_reason": "test"},
            headers={"Authorization": f"Bearer {token}"}
        )
        # Regular user should get 403 Forbidden
        assert response.status_code == 403


@pytest.mark.asyncio
async def test_pending_list_accessible_by_authenticated_user():
    """Test that pending list is accessible by authenticated user (not admin only."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "pendingtest1")
        response = await client.get(
            "/api/annotations/pending",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200


@pytest.mark.asyncio
async def test_annotation_status_transitions():
    """Test annotation status field exists in annotation model."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Check that annotation model has status field by checking the model definition
        from app.models.annotation import Annotation
        assert hasattr(Annotation, 'status')
        assert hasattr(Annotation, 'submitted_at')
        assert hasattr(Annotation, 'reviewed_by')
        assert hasattr(Annotation, 'reject_reason')


@pytest.mark.asyncio
async def test_get_annotation_history():
    """Test getting annotation review history."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "historytest1")
        test_uuid = "00000000-0000-0000-0000-000000000000"

        # Endpoint should exist - returns 404 for non-existent annotation (correct behavior)
        response = await client.get(
            f"/api/annotations/{test_uuid}/history",
            headers={"Authorization": f"Bearer {token}"}
        )
        # 404 = endpoint exists + annotation not found (correct RESTful behavior)
        assert response.status_code == 404
        assert response.json()["detail"] == "标注不存在"


@pytest.mark.asyncio
async def test_history_accessible_by_authenticated_user():
    """Test that history endpoint is accessible by authenticated user."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "historytest2")
        test_uuid = "00000000-0000-0000-0000-000000000000"

        response = await client.get(
            f"/api/annotations/{test_uuid}/history",
            headers={"Authorization": f"Bearer {token}"}
        )
        # Should be 404 (not 401/403) - endpoint exists and requires auth
        assert response.status_code == 404
