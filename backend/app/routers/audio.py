import os
import uuid
import aiofiles
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from pydub import AudioSegment

from app.database import get_db
from app.models.audio import AudioFile
from app.models.user import User
from app.schemas.audio import AudioFileResponse, AudioFileList
from app.routers.auth import get_current_user

router = APIRouter(prefix="/audio", tags=["audio"])

@router.post("/upload", response_model=AudioFileResponse)
async def upload_audio(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.wav', '.mp3', '.flac', '.ogg']:
        raise HTTPException(status_code=400, detail="Unsupported file format")

    file_id = uuid.uuid4()
    filepath = f"uploads/{file_id}{ext}"

    os.makedirs("uploads", exist_ok=True)

    async with aiofiles.open(filepath, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)

    audio = AudioSegment.from_file(filepath)
    duration = len(audio) / 1000.0
    sample_rate = audio.frame_rate

    db_audio = AudioFile(
        id=file_id,
        filename=file.filename,
        filepath=filepath,
        duration=duration,
        sample_rate=sample_rate,
        file_size=len(content),
        uploader_id=current_user.id
    )
    db.add(db_audio)
    db.commit()
    db.refresh(db_audio)
    return db_audio

@router.get("", response_model=AudioFileList)
def list_audio(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(AudioFile).options(joinedload(AudioFile.uploader))
    if search:
        query = query.filter(AudioFile.filename.contains(search))

    total = query.count()
    items = query.order_by(AudioFile.created_at.desc()).offset((page-1)*page_size).limit(page_size).all()

    result = []
    for item in items:
        result.append(AudioFileResponse(
            id=item.id,
            filename=item.filename,
            filepath=item.filepath,
            duration=item.duration,
            sample_rate=item.sample_rate,
            file_size=item.file_size,
            uploader_id=item.uploader_id,
            uploader_name=item.uploader.full_name or item.uploader.username if item.uploader else None,
            created_at=item.created_at
        ))
    return AudioFileList(items=result, total=total, page=page, page_size=page_size)

@router.get("/{audio_id}/stream")
async def stream_audio(audio_id: uuid.UUID, db: Session = Depends(get_db)):
    audio = db.query(AudioFile).filter(AudioFile.id == audio_id).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Audio not found")

    if not os.path.exists(audio.filepath):
        raise HTTPException(status_code=404, detail="File not found")

    from fastapi.responses import FileResponse
    return FileResponse(audio.filepath, media_type="audio/wav", filename=audio.filename)

@router.get("/{audio_id}", response_model=AudioFileResponse)
def get_audio(audio_id: uuid.UUID, db: Session = Depends(get_db)):
    audio = db.query(AudioFile).options(joinedload(AudioFile.uploader)).filter(AudioFile.id == audio_id).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Audio not found")
    return AudioFileResponse(
        id=audio.id,
        filename=audio.filename,
        filepath=audio.filepath,
        duration=audio.duration,
        sample_rate=audio.sample_rate,
        file_size=audio.file_size,
        uploader_id=audio.uploader_id,
        uploader_name=audio.uploader.full_name or audio.uploader.username if audio.uploader else None,
        created_at=audio.created_at
    )

@router.delete("/{audio_id}")
def delete_audio(
    audio_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    audio = db.query(AudioFile).filter(AudioFile.id == audio_id).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Audio not found")

    if os.path.exists(audio.filepath):
        os.remove(audio.filepath)

    db.delete(audio)
    db.commit()
    return {"message": "Deleted"}

@router.post("/{audio_id}/clip")
def clip_audio(
    audio_id: uuid.UUID,
    start_time: float,
    end_time: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """裁剪音频片段并保存为独立文件"""
    audio = db.query(AudioFile).filter(AudioFile.id == audio_id).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Audio not found")

    if not os.path.exists(audio.filepath):
        raise HTTPException(status_code=404, detail="Audio file not found")

    # 验证时间参数
    if start_time < 0:
        raise HTTPException(status_code=400, detail="start_time must be >= 0")
    if end_time <= start_time:
        raise HTTPException(status_code=400, detail="end_time must be > start_time")
    if end_time > audio.duration:
        raise HTTPException(status_code=400, detail="end_time exceeds audio duration")

    # 生成片段文件名
    clip_id = uuid.uuid4()
    ext = os.path.splitext(audio.filepath)[1]
    clip_filepath = f"uploads/{clip_id}{ext}"

    # 使用pydub裁剪音频
    from pydub import AudioSegment
    import shutil

    try:
        audio_segment = AudioSegment.from_file(audio.filepath)
        # pydub使用毫秒
        start_ms = start_time * 1000
        end_ms = end_time * 1000
        clip = audio_segment[start_ms:end_ms]
        clip.export(clip_filepath, format=ext[1:] if ext.startswith('.') else ext)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clip audio: {str(e)}")

    return {"clip_filepath": clip_filepath, "clip_id": str(clip_id)}

@router.get("/clip/{clip_filepath:path}")
async def stream_clip(clip_filepath: str):
    """流式播放裁剪后的音频片段"""
    if not os.path.exists(clip_filepath):
        raise HTTPException(status_code=404, detail="Clip file not found")

    from fastapi.responses import FileResponse
    filename = os.path.basename(clip_filepath)
    return FileResponse(clip_filepath, media_type="audio/wav", filename=filename)
