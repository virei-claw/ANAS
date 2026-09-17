-- 迁移脚本: 添加 uploader_id 和 annotator_id 字段
-- 执行: PGPASSWORD='1234567@byd' psql -h localhost -U postgres -d audioDataSets -f migration.sql

-- 添加 uploader_id 字段到 audio_files 表
ALTER TABLE audio_files ADD COLUMN IF NOT EXISTS uploader_id VARCHAR(36);
ALTER TABLE audio_files ADD CONSTRAINT fk_audio_uploader FOREIGN KEY (uploader_id) REFERENCES users(id);

-- 添加 annotator_id 字段到 annotations 表
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS annotator_id VARCHAR(36);
ALTER TABLE annotations ADD CONSTRAINT fk_annotation_annotator FOREIGN KEY (annotator_id) REFERENCES users(id);

-- 更新现有记录（如果有的话）
-- UPDATE audio_files SET uploader_id = '00000000-0000-0000-0000-000000000000' WHERE uploader_id IS NULL;
-- UPDATE annotations SET annotator_id = '00000000-0000-0000-0000-000000000000' WHERE annotator_id IS NULL;

SELECT 'Migration completed' as status;
