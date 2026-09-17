"""
快速迁移脚本
"""
import sys
sys.path.insert(0, '.')

from app.database import engine
from sqlalchemy import text

# 先检查表结构
with engine.connect() as conn:
    conn.execute(text("COMMIT"))  # 结束任何挂起的事务

    try:
        conn.execute(text("ALTER TABLE audio_files ADD COLUMN uploader_id VARCHAR(36)"))
        print("Added uploader_id to audio_files")
    except Exception as e:
        if "already exists" in str(e) or "Duplicate" in str(e):
            print("uploader_id already exists")
        else:
            print(f"audio_files: {e}")

    try:
        conn.execute(text("ALTER TABLE annotations ADD COLUMN annotator_id VARCHAR(36)"))
        print("Added annotator_id to annotations")
    except Exception as e:
        if "already exists" in str(e) or "Duplicate" in str(e):
            print("annotator_id already exists")
        else:
            print(f"annotations: {e}")

print("Done")
