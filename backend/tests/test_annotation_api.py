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


@pytest.mark.asyncio
async def test_delete_annotation():
    """Test deleting an annotation."""
    from unittest.mock import patch, MagicMock

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "deletetest")

        # Mock AudioSegment to avoid file processing
        mock_audio = MagicMock()
        mock_audio.__len__ = MagicMock(return_value=1000)
        mock_audio.frame_rate = 44100

        with patch("app.routers.audio.AudioSegment") as mock_segment:
            mock_segment.from_file.return_value = mock_audio

            # Create audio via API
            audio_resp = await client.post(
                "/api/audio/upload",
                files={"file": ("test.wav", b"RIFF" + b"\x00" * 100, "audio/wav")},
                headers={"Authorization": f"Bearer {token}"}
            )
        audio_id = audio_resp.json()["id"]

        # Create annotation
        ann_resp = await client.post(
            "/api/annotations",
            json={
                "audio_id": audio_id,
                "start_time": 0.0,
                "end_time": 1.0,
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert ann_resp.status_code == 200
        ann_id = ann_resp.json()["id"]

        # Delete annotation
        delete_resp = await client.delete(
            f"/api/annotations/{ann_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert delete_resp.status_code == 200
        assert delete_resp.json()["message"] == "Deleted"

        # Verify it's gone
        get_resp = await client.get(
            f"/api/annotations/{ann_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_create_annotation_success():
    """Test creating an annotation with valid data."""
    from unittest.mock import patch, MagicMock

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "createtest")

        # Mock AudioSegment
        mock_audio = MagicMock()
        mock_audio.__len__ = MagicMock(return_value=10000)
        mock_audio.frame_rate = 44100

        with patch("app.routers.audio.AudioSegment") as mock_segment:
            mock_segment.from_file.return_value = mock_audio

            # Create audio
            audio_resp = await client.post(
                "/api/audio/upload",
                files={"file": ("test.wav", b"RIFF" + b"\x00" * 100, "audio/wav")},
                headers={"Authorization": f"Bearer {token}"}
            )
        audio_id = audio_resp.json()["id"]

        # Create annotation with full data
        ann_resp = await client.post(
            "/api/annotations",
            json={
                "audio_id": audio_id,
                "start_time": 1.0,
                "end_time": 2.5,
                "speed": 60,
                "temperature": 25,
                "test_mode": "dynamic",
                "reason": "异响原因",
                "solution": "解决方案"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        assert ann_resp.status_code == 200
        data = ann_resp.json()
        assert data["audio_id"] == audio_id
        assert data["start_time"] == 1.0
        assert data["end_time"] == 2.5
        assert data["speed"] == 60
        assert data["temperature"] == 25
        assert data["test_mode"] == "dynamic"
        assert data["reason"] == "异响原因"
        assert data["solution"] == "解决方案"
        assert data["status"] == "draft"
        assert "id" in data


@pytest.mark.asyncio
async def test_create_annotation_requires_auth():
    """Test creating annotation without auth returns 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/annotations",
            json={
                "audio_id": "00000000-0000-0000-0000-000000000000",
                "start_time": 0.0,
                "end_time": 1.0
            }
        )
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_annotation_success():
    """Test getting an existing annotation."""
    from unittest.mock import patch, MagicMock

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "getanntest")

        # Mock AudioSegment
        mock_audio = MagicMock()
        mock_audio.__len__ = MagicMock(return_value=10000)
        mock_audio.frame_rate = 44100

        with patch("app.routers.audio.AudioSegment") as mock_segment:
            mock_segment.from_file.return_value = mock_audio

            # Create audio
            audio_resp = await client.post(
                "/api/audio/upload",
                files={"file": ("test.wav", b"RIFF" + b"\x00" * 100, "audio/wav")},
                headers={"Authorization": f"Bearer {token}"}
            )
        audio_id = audio_resp.json()["id"]

        # Create annotation
        ann_resp = await client.post(
            "/api/annotations",
            json={
                "audio_id": audio_id,
                "start_time": 0.0,
                "end_time": 1.0
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        ann_id = ann_resp.json()["id"]

        # Get annotation
        get_resp = await client.get(
            f"/api/annotations/{ann_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert get_resp.status_code == 200
        data = get_resp.json()
        assert data["id"] == ann_id
        assert data["audio_id"] == audio_id


@pytest.mark.asyncio
async def test_update_annotation_success():
    """Test updating an annotation."""
    from unittest.mock import patch, MagicMock

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "updatetest")

        # Mock AudioSegment
        mock_audio = MagicMock()
        mock_audio.__len__ = MagicMock(return_value=10000)
        mock_audio.frame_rate = 44100

        with patch("app.routers.audio.AudioSegment") as mock_segment:
            mock_segment.from_file.return_value = mock_audio

            # Create audio
            audio_resp = await client.post(
                "/api/audio/upload",
                files={"file": ("test.wav", b"RIFF" + b"\x00" * 100, "audio/wav")},
                headers={"Authorization": f"Bearer {token}"}
            )
        audio_id = audio_resp.json()["id"]

        # Create annotation
        ann_resp = await client.post(
            "/api/annotations",
            json={
                "audio_id": audio_id,
                "start_time": 0.0,
                "end_time": 1.0,
                "reason": "原始原因"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        ann_id = ann_resp.json()["id"]

        # Update annotation
        update_resp = await client.put(
            f"/api/annotations/{ann_id}",
            json={"reason": "更新后的原因", "speed": 80},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert update_resp.status_code == 200
        data = update_resp.json()
        assert data["reason"] == "更新后的原因"
        assert data["speed"] == 80


@pytest.mark.asyncio
async def test_list_annotations_for_audio():
    """Test listing annotations for a specific audio."""
    from unittest.mock import patch, MagicMock

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "listanntest")

        # Mock AudioSegment
        mock_audio = MagicMock()
        mock_audio.__len__ = MagicMock(return_value=10000)
        mock_audio.frame_rate = 44100

        with patch("app.routers.audio.AudioSegment") as mock_segment:
            mock_segment.from_file.return_value = mock_audio

            # Create audio
            audio_resp = await client.post(
                "/api/audio/upload",
                files={"file": ("test.wav", b"RIFF" + b"\x00" * 100, "audio/wav")},
                headers={"Authorization": f"Bearer {token}"}
            )
        audio_id = audio_resp.json()["id"]

        # Create two annotations
        await client.post(
            "/api/annotations",
            json={"audio_id": audio_id, "start_time": 0.0, "end_time": 1.0},
            headers={"Authorization": f"Bearer {token}"}
        )
        await client.post(
            "/api/annotations",
            json={"audio_id": audio_id, "start_time": 2.0, "end_time": 3.0},
            headers={"Authorization": f"Bearer {token}"}
        )

        # List annotations for this audio
        list_resp = await client.get(
            f"/api/annotations?audio_id={audio_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert list_resp.status_code == 200
        data = list_resp.json()
        assert isinstance(data, list)
        assert len(data) == 2


@pytest.mark.asyncio
async def test_get_my_annotations():
    """Test getting current user's annotations."""
    from unittest.mock import patch, MagicMock

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "myanntest")

        # Mock AudioSegment
        mock_audio = MagicMock()
        mock_audio.__len__ = MagicMock(return_value=10000)
        mock_audio.frame_rate = 44100

        with patch("app.routers.audio.AudioSegment") as mock_segment:
            mock_segment.from_file.return_value = mock_audio

            # Create audio
            audio_resp = await client.post(
                "/api/audio/upload",
                files={"file": ("test.wav", b"RIFF" + b"\x00" * 100, "audio/wav")},
                headers={"Authorization": f"Bearer {token}"}
            )
        audio_id = audio_resp.json()["id"]

        # Create annotation
        await client.post(
            "/api/annotations",
            json={"audio_id": audio_id, "start_time": 0.0, "end_time": 1.0},
            headers={"Authorization": f"Bearer {token}"}
        )

        # Get my annotations
        my_resp = await client.get(
            "/api/annotations/my",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert my_resp.status_code == 200
        data = my_resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1


@pytest.mark.asyncio
async def test_submit_annotation_success():
    """Test submitting an annotation for review."""
    from unittest.mock import patch, MagicMock

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "subanntest")

        # Mock AudioSegment
        mock_audio = MagicMock()
        mock_audio.__len__ = MagicMock(return_value=10000)
        mock_audio.frame_rate = 44100

        with patch("app.routers.audio.AudioSegment") as mock_segment:
            mock_segment.from_file.return_value = mock_audio

            # Create audio
            audio_resp = await client.post(
                "/api/audio/upload",
                files={"file": ("test.wav", b"RIFF" + b"\x00" * 100, "audio/wav")},
                headers={"Authorization": f"Bearer {token}"}
            )
        audio_id = audio_resp.json()["id"]

        # Create annotation
        ann_resp = await client.post(
            "/api/annotations",
            json={"audio_id": audio_id, "start_time": 0.0, "end_time": 1.0},
            headers={"Authorization": f"Bearer {token}"}
        )
        ann_id = ann_resp.json()["id"]

        # Submit annotation
        submit_resp = await client.put(
            f"/api/annotations/{ann_id}/submit",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert submit_resp.status_code == 200
        assert "已提交" in submit_resp.json()["message"]

        # Verify status changed
        get_resp = await client.get(
            f"/api/annotations/{ann_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert get_resp.json()["status"] == "submitted"


@pytest.mark.asyncio
async def test_batch_submit_annotations():
    """Test batch submitting multiple annotations."""
    from unittest.mock import patch, MagicMock

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "batchsubtest")

        # Mock AudioSegment
        mock_audio = MagicMock()
        mock_audio.__len__ = MagicMock(return_value=10000)
        mock_audio.frame_rate = 44100

        with patch("app.routers.audio.AudioSegment") as mock_segment:
            mock_segment.from_file.return_value = mock_audio

            # Create audio
            audio_resp = await client.post(
                "/api/audio/upload",
                files={"file": ("test.wav", b"RIFF" + b"\x00" * 100, "audio/wav")},
                headers={"Authorization": f"Bearer {token}"}
            )
        audio_id = audio_resp.json()["id"]

        # Create annotations
        ann1_resp = await client.post(
            "/api/annotations",
            json={"audio_id": audio_id, "start_time": 0.0, "end_time": 1.0},
            headers={"Authorization": f"Bearer {token}"}
        )
        ann2_resp = await client.post(
            "/api/annotations",
            json={"audio_id": audio_id, "start_time": 2.0, "end_time": 3.0},
            headers={"Authorization": f"Bearer {token}"}
        )
        ann1_id = ann1_resp.json()["id"]
        ann2_id = ann2_resp.json()["id"]

        # Batch submit
        batch_resp = await client.post(
            "/api/annotations/batch-submit",
            json={"annotation_ids": [ann1_id, ann2_id]},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert batch_resp.status_code == 200
        assert "已提交 2 条标注" in batch_resp.json()["message"]


@pytest.mark.asyncio
async def test_list_annotations_requires_auth():
    """Test listing annotations requires authentication."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/annotations")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_annotations_with_part_name_filter():
    """Test listing annotations filtered by part_name."""
    from unittest.mock import patch, MagicMock

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "partfiltertest")

        # Mock AudioSegment
        mock_audio = MagicMock()
        mock_audio.__len__ = MagicMock(return_value=10000)
        mock_audio.frame_rate = 44100

        with patch("app.routers.audio.AudioSegment") as mock_segment:
            mock_segment.from_file.return_value = mock_audio

            # Create audio
            audio_resp = await client.post(
                "/api/audio/upload",
                files={"file": ("test.wav", b"RIFF" + b"\x00" * 100, "audio/wav")},
                headers={"Authorization": f"Bearer {token}"}
            )
        audio_id = audio_resp.json()["id"]

        # Create part_names first
        part_resp = await client.post(
            "/api/dict/part-names",
            json={"name": "车门"},
            headers={"Authorization": f"Bearer {token}"}
        )
        part_id = part_resp.json()["id"]

        # Create annotation with part_name
        await client.post(
            "/api/annotations",
            json={
                "audio_id": audio_id,
                "start_time": 0.0,
                "end_time": 1.0,
                "part_name_id": part_id
            },
            headers={"Authorization": f"Bearer {token}"}
        )

        # Filter by part_name
        list_resp = await client.get(
            "/api/annotations?part_name=车门",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert list_resp.status_code == 200
        data = list_resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["part_name"] == "车门"


@pytest.mark.asyncio
async def test_list_annotations_with_noise_type_filter():
    """Test listing annotations filtered by noise_type."""
    from unittest.mock import patch, MagicMock

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "noisefiltertest")

        # Mock AudioSegment
        mock_audio = MagicMock()
        mock_audio.__len__ = MagicMock(return_value=10000)
        mock_audio.frame_rate = 44100

        with patch("app.routers.audio.AudioSegment") as mock_segment:
            mock_segment.from_file.return_value = mock_audio

            # Create audio
            audio_resp = await client.post(
                "/api/audio/upload",
                files={"file": ("test.wav", b"RIFF" + b"\x00" * 100, "audio/wav")},
                headers={"Authorization": f"Bearer {token}"}
            )
        audio_id = audio_resp.json()["id"]

        # Create noise_types
        noise_resp = await client.post(
            "/api/dict/noise-types",
            json={"name": "松旷异响"},
            headers={"Authorization": f"Bearer {token}"}
        )
        noise_id = noise_resp.json()["id"]

        # Create annotation with noise_type
        await client.post(
            "/api/annotations",
            json={
                "audio_id": audio_id,
                "start_time": 0.0,
                "end_time": 1.0,
                "noise_type_id": noise_id
            },
            headers={"Authorization": f"Bearer {token}"}
        )

        # Filter by noise_type
        list_resp = await client.get(
            "/api/annotations?noise_type=松旷异响",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert list_resp.status_code == 200
        data = list_resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["noise_type"] == "松旷异响"


@pytest.mark.asyncio
async def test_list_annotations_with_status_filter():
    """Test listing annotations filtered by status."""
    from unittest.mock import patch, MagicMock

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "statusfiltertest")

        # Mock AudioSegment
        mock_audio = MagicMock()
        mock_audio.__len__ = MagicMock(return_value=10000)
        mock_audio.frame_rate = 44100

        with patch("app.routers.audio.AudioSegment") as mock_segment:
            mock_segment.from_file.return_value = mock_audio

            # Create audio
            audio_resp = await client.post(
                "/api/audio/upload",
                files={"file": ("test.wav", b"RIFF" + b"\x00" * 100, "audio/wav")},
                headers={"Authorization": f"Bearer {token}"}
            )
        audio_id = audio_resp.json()["id"]

        # Create annotation
        ann_resp = await client.post(
            "/api/annotations",
            json={"audio_id": audio_id, "start_time": 0.0, "end_time": 1.0},
            headers={"Authorization": f"Bearer {token}"}
        )
        ann_id = ann_resp.json()["id"]

        # Submit annotation to change status to submitted
        await client.put(
            f"/api/annotations/{ann_id}/submit",
            headers={"Authorization": f"Bearer {token}"}
        )

        # Filter by status=submitted
        list_resp = await client.get(
            "/api/annotations?status=submitted",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert list_resp.status_code == 200
        data = list_resp.json()
        assert isinstance(data, list)
        assert any(ann["status"] == "submitted" for ann in data)


@pytest.mark.asyncio
async def test_list_annotations_pagination():
    """Test listing annotations with pagination."""
    from unittest.mock import patch, MagicMock

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "paginationtest")

        # Mock AudioSegment
        mock_audio = MagicMock()
        mock_audio.__len__ = MagicMock(return_value=100000)
        mock_audio.frame_rate = 44100

        with patch("app.routers.audio.AudioSegment") as mock_segment:
            mock_segment.from_file.return_value = mock_audio

            # Create audio
            audio_resp = await client.post(
                "/api/audio/upload",
                files={"file": ("test.wav", b"RIFF" + b"\x00" * 100, "audio/wav")},
                headers={"Authorization": f"Bearer {token}"}
            )
        audio_id = audio_resp.json()["id"]

        # Create multiple annotations
        for i in range(5):
            await client.post(
                "/api/annotations",
                json={"audio_id": audio_id, "start_time": float(i), "end_time": float(i + 1)},
                headers={"Authorization": f"Bearer {token}"}
            )

        # Test pagination - page 1 with page_size=2
        list_resp = await client.get(
            "/api/annotations?page=1&page_size=2",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert list_resp.status_code == 200
        # Currently returns list, pagination info may be in headers or wrapper
