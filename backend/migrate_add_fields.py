"""
数据库迁移脚本 - 添加 uploader_id 和 annotator_id 字段
"""
import sys
sys.path.insert(0, '.')

from app.database import engine, SessionLocal
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        # 检查 audio_files.uploader_id 是否存在
        result = conn.execute(text("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'audio_files' AND column_name = 'uploader_id'
        """))
        if not result.fetchone():
            conn.execute(text("ALTER TABLE audio_files ADD COLUMN uploader_id VARCHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'"))
            conn.execute(text("ALTER TABLE audio_files ADD CONSTRAINT fk_audio_uploader FOREIGN KEY (uploader_id) REFERENCES users(id)"))
            print("[OK] Added uploader_id to audio_files")
        else:
            print("[OK] uploader_id already exists in audio_files")

        # 检查 annotations.annotator_id 是否存在
        result = conn.execute(text("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'annotations' AND column_name = 'annotator_id'
        """))
        if not result.fetchone():
            conn.execute(text("ALTER TABLE annotations ADD COLUMN annotator_id VARCHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'"))
            conn.execute(text("ALTER TABLE annotations ADD CONSTRAINT fk_annotation_annotator FOREIGN KEY (annotator_id) REFERENCES users(id)"))
            print("[OK] Added annotator_id to annotations")
        else:
            print("[OK] annotator_id already exists in annotations")

        conn.commit()
        print("\n[Done] Migration completed!")

if __name__ == "__main__":
    migrate()
