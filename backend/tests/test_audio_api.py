"""
Test for audio API endpoints.
Following TDD: RED first, then GREEN.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_audio_list_empty():
    """Test that audio list returns empty list when no audio exists."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/audio")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert isinstance(data["items"], list)


@pytest.mark.asyncio
async def test_audio_list_pagination():
    """Test audio list pagination parameters."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/audio?page=1&page_size=10")
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 10


@pytest.mark.asyncio
async def test_audio_list_search():
    """Test audio list with search parameter."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/audio?search=test")
        assert response.status_code == 200


@pytest.mark.asyncio
async def test_audio_list_filter_annotated():
    """Test audio list with annotated filter."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/audio?filter=annotated")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data


@pytest.mark.asyncio
async def test_audio_list_filter_unannotated():
    """Test audio list with unannotated filter."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/audio?filter=unannotated")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data


@pytest.mark.asyncio
async def test_audio_list_filter_reviewing():
    """Test audio list with reviewing filter."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/audio?filter=reviewing")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data


@pytest.mark.asyncio
async def test_audio_get_not_found():
    """Test getting non-existent audio returns 404."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/audio/00000000-0000-0000-0000-000000000000")
        assert response.status_code == 404


@pytest.mark.asyncio
async def test_audio_delete_requires_auth():
    """Test deleting audio without auth returns 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.delete("/api/audio/00000000-0000-0000-0000-000000000000")
        assert response.status_code == 401  # 认证required
