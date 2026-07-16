-- ============================================================
-- 운영(Supabase PostgreSQL) 인덱스 적용 스크립트
-- 근거: docs/refactoring/04-db-indexes.md
-- 실행 위치: Supabase Dashboard → SQL Editor
-- 이름은 엔티티 @Index 선언과 동일하게 유지 (Hibernate 중복 생성 방지)
-- ============================================================

-- running_records ────────────────────────────────────────────
-- 개인 대시보드/내 기록: WHERE member_id = ? AND status = 'APPROVED'
CREATE INDEX IF NOT EXISTS idx_records_member_status
    ON running_records (member_id, status);

-- 대회별 랭킹/배틀: WHERE competition_id = ? AND status = 'APPROVED'
--                    AND running_date BETWEEN ? AND ?   (등가 → 등가 → 범위)
CREATE INDEX IF NOT EXISTS idx_records_comp_status_date
    ON running_records (competition_id, status, running_date);

-- 승인 대기 목록(WAITING) + 데일리킹/주간 성장률(APPROVED + 날짜)
CREATE INDEX IF NOT EXISTS idx_records_status_date
    ON running_records (status, running_date);

-- 홈 활동 피드: WHERE status='APPROVED' ORDER BY verified_at DESC LIMIT 10
CREATE INDEX IF NOT EXISTS idx_records_status_verified
    ON running_records (status, verified_at);

-- 업로드마다 실행되는 중복 사진 검사: WHERE photo_hash = ?
CREATE INDEX IF NOT EXISTS idx_records_photo_hash
    ON running_records (photo_hash);

-- rank_snapshots ─────────────────────────────────────────────
-- 순위 변동 조회: WHERE entity_type=? AND competition_id=? AND snapshot_date < ?
-- 스케줄러 삭제:  WHERE entity_type=? AND competition_id=? AND snapshot_date = ?
CREATE INDEX IF NOT EXISTS idx_rank_snapshots_type_comp_date
    ON rank_snapshots (entity_type, competition_id, snapshot_date);

-- ============================================================
-- 적용 확인
-- ============================================================
-- SELECT indexname, indexdef FROM pg_indexes
--  WHERE tablename IN ('running_records', 'rank_snapshots')
--  ORDER BY tablename, indexname;

-- 실행 계획 확인 예시 (Index Scan / Bitmap Index Scan이 나오면 적용된 것):
-- EXPLAIN ANALYZE
-- SELECT * FROM running_records
--  WHERE member_id = 1 AND status = 'APPROVED';
