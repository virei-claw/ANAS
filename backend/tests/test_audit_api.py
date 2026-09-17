"""
Test for audit log API endpoints.
"""

import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app


async def get_auth_token(client: AsyncClient, username: str = "audittest") -> str:
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
async def test_get_audit_logs_requires_auth():
    """Test that audit logs endpoint requires authentication."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/audit/logs")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_audit_logs_empty():
    """Test getting audit logs when there are none."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "auditempty")

        response = await client.get(
            "/api/audit/logs",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] == 0


@pytest.mark.asyncio
async def test_get_audit_logs_with_pagination():
    """Test audit logs pagination parameters."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "auditpage")

        response = await client.get(
            "/api/audit/logs?page=1&page_size=10",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 10


@pytest.mark.asyncio
async def test_annotation_create_logs_action():
    """Test that creating an annotation logs the action."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "auditcreate")

        # Create an audio first
        audio_resp = await client.post(
            "/api/audio/upload",
            files={"file": ("test.wav", b"RIFF" + b"\x00" * 100, "audio/wav")},
            headers={"Authorization": f"Bearer {token}"}
        )
        audio_id = audio_resp.json()["id"]

        # Create annotation
        annotation_resp = await client.post(
            "/api/annotations",
            json={
                "audio_id": audio_id,
                "start_time": 0.0,
                "end_time": 1.0,
                "part_name_id": None,
                "noise_type_id": None,
                "road_type_id": None
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert annotation_resp.status_code == 200
        annotation_id = annotation_resp.json()["id"]

        # Verify audit log was created
        log_response = await client.get(
            "/api/audit/logs?entity_type=annotation",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert log_response.status_code == 200
        logs = log_response.json()["items"]
        assert any(l["action"] == "CREATE" and l["resource"] == "annotation" for l in logs)


@pytest.mark.asyncio
async def test_annotation_update_logs_action():
    """Test that updating an annotation logs the action."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "auditupdate")

        # Create audio and annotation
        audio_resp = await client.post(
            "/api/audio/upload",
            files={"file": ("test.wav", b"RIFF" + b"\x00" * 100, "audio/wav")},
            headers={"Authorization": f"Bearer {token}"}
        )
        audio_id = audio_resp.json()["id"]

        annotation_resp = await client.post(
            "/api/annotations",
            json={
                "audio_id": audio_id,
                "start_time": 0.0,
                "end_time": 1.0,
                "part_name_id": None,
                "noise_type_id": None,
                "road_type_id": None
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        annotation_id = annotation_resp.json()["id"]

        # Update annotation
        update_resp = await client.put(
            f"/api/annotations/{annotation_id}",
            json={"reason": "test reason"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert update_resp.status_code == 200

        # Verify audit log was created for update
        log_response = await client.get(
            "/api/audit/logs?entity_type=annotation",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert log_response.status_code == 200
        logs = log_response.json()["items"]
        assert any(l["action"] == "UPDATE" and l["resource"] == "annotation" for l in logs)


@pytest.mark.asyncio
async def test_annotation_delete_logs_action():
    """Test that deleting an annotation logs the action."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "auditdelete")

        # Create audio and annotation
        audio_resp = await client.post(
            "/api/audio/upload",
            files={"file": ("test.wav", b"RIFF" + b"\x00" * 100, "audio/wav")},
            headers={"Authorization": f"Bearer {token}"}
        )
        audio_id = audio_resp.json()["id"]

        annotation_resp = await client.post(
            "/api/annotations",
            json={
                "audio_id": audio_id,
                "start_time": 0.0,
                "end_time": 1.0,
                "part_name_id": None,
                "noise_type_id": None,
                "road_type_id": None
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        annotation_id = annotation_resp.json()["id"]

        # Delete annotation
        delete_resp = await client.delete(
            f"/api/annotations/{annotation_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert delete_resp.status_code == 200

        # Verify audit log was created for delete
        log_response = await client.get(
            "/api/audit/logs?entity_type=annotation",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert log_response.status_code == 200
        logs = log_response.json()["items"]
        assert any(l["action"] == "DELETE" and l["resource"] == "annotation" for l in logs)
