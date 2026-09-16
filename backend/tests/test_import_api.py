"""
Test for annotation import API endpoint.
"""

import pytest
import uuid
import io
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import Base, engine, get_db, SessionLocal
from app.models import *  # noqa: F401, F403


async def get_auth_token(client: AsyncClient, username: str = "importtest") -> str:
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


def create_audio_directly(audio_id: str, uploader_id: str) -> None:
    """Helper: create audio file directly in database."""
    db = SessionLocal()
    try:
        audio = AudioFile(
            id=audio_id,
            filename="test.wav",
            filepath="/tmp/test.wav",
            duration=10.0,
            sample_rate=44100,
            file_size=1000,
            uploader_id=uploader_id
        )
        db.add(audio)
        db.commit()
    finally:
        db.close()


@pytest.mark.asyncio
async def test_import_annotations_requires_auth():
    """Test that import endpoint requires authentication."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create a simple CSV content
        csv_content = "audio_id,part_name,noise_type,road_type,speed,temperature,test_mode,reason,solution,start_time,end_time\n"
        csv_content += f"{uuid.uuid4()}, engine, rattle, asphalt, 60, 25, dynamic, test, fix, 0.0, 1.0\n"

        response = await client.post(
            "/api/annotations/import",
            files={"file": ("test.csv", io.BytesIO(csv_content.encode()), "text/csv")}
        )
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_import_annotations_with_valid_data():
    """Test importing annotations with valid CSV data."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "importvalid")

        # Get user id from token response
        me_resp = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        user_id = me_resp.json()["id"]

        # Create an audio file directly in database
        audio_id = str(uuid.uuid4())
        create_audio_directly(audio_id, user_id)

        # Create part_names, noise_types, road_types first
        part_resp = await client.post(
            "/api/dict/part-names",
            json={"name": "engine"},
            headers={"Authorization": f"Bearer {token}"}
        )
        noise_resp = await client.post(
            "/api/dict/noise-types",
            json={"name": "rattle"},
            headers={"Authorization": f"Bearer {token}"}
        )
        road_resp = await client.post(
            "/api/dict/road-types",
            json={"name": "asphalt"},
            headers={"Authorization": f"Bearer {token}"}
        )

        # Create CSV with valid data
        csv_content = f"""audio_id,part_name,noise_type,road_type,speed,temperature,test_mode,reason,solution,start_time,end_time
{audio_id},engine,rattle,asphalt,60,25,dynamic,test reason,test solution,0.0,1.5"""

        response = await client.post(
            "/api/annotations/import",
            files={"file": ("annotations.csv", io.BytesIO(csv_content.encode()), "text/csv")},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 200
        result = response.json()
        assert result["total"] == 1
        assert result["success"] == 1
        assert result["failed"] == 0


@pytest.mark.asyncio
async def test_import_annotations_with_invalid_rows():
    """Test that invalid rows are skipped and recorded."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "importinvalid")

        # Get user id
        me_resp = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        user_id = me_resp.json()["id"]

        # Create an audio file directly
        audio_id = str(uuid.uuid4())
        create_audio_directly(audio_id, user_id)

        # Create dictionaries
        await client.post(
            "/api/dict/part-names",
            json={"name": "brake"},
            headers={"Authorization": f"Bearer {token}"}
        )

        # CSV with one valid and one invalid row (missing required fields)
        csv_content = f"""audio_id,part_name,noise_type,road_type,speed,temperature,test_mode,reason,solution,start_time,end_time
{audio_id},brake,rattle,asphalt,60,25,dynamic,reason,solution,0.0,1.0
{uuid.uuid4()},,noise,road,60,25,dynamic,reason,solution,0.0,1.0"""

        response = await client.post(
            "/api/annotations/import",
            files={"file": ("mixed.csv", io.BytesIO(csv_content.encode()), "text/csv")},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 200
        result = response.json()
        assert result["total"] == 2
        assert result["success"] == 1
        assert result["failed"] == 1
        assert len(result["errors"]) == 1


@pytest.mark.asyncio
async def test_import_annotations_missing_required_fields():
    """Test that missing audio_id returns error."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_auth_token(client, "importmissing")

        # CSV missing audio_id
        csv_content = """audio_id,part_name,noise_type,road_type,speed,temperature,test_mode,reason,solution,start_time,end_time
,engine,rattle,asphalt,60,25,dynamic,reason,solution,0.0,1.0"""

        response = await client.post(
            "/api/annotations/import",
            files={"file": ("missing.csv", io.BytesIO(csv_content.encode()), "text/csv")},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 200
        result = response.json()
        assert result["failed"] == 1
        assert "audio_id" in result["errors"][0]["message"].lower() or "required" in result["errors"][0]["message"].lower()
