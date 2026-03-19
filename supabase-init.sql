-- ============================================================
-- ND-RUNNING 초기 데이터 삽입 SQL
-- Supabase SQL Editor에서 전체 복사 후 실행
-- admin 계정: admin1 / admin1234, admin2 / admin1234
-- 일반 회원: 이름+전화로 최초 로그인 후 계정 설정
-- ============================================================

-- 1. 대회
INSERT INTO competitions (title, start_date, end_date, is_active, created_at)
VALUES ('제1회 ND-RUNNING 청백전', '2026-03-20', '2026-04-05', true, NOW());

-- 2. 팀 (청팀: 파랑 / 백팀: 그레이)
INSERT INTO teams (competition_id, team_name, color_code) VALUES
((SELECT id FROM competitions WHERE title = '제1회 ND-RUNNING 청백전'), '청팀', '#3B82F6'),
((SELECT id FROM competitions WHERE title = '제1회 ND-RUNNING 청백전'), '백팀', '#9CA3AF');

-- 3. 조 (청팀: 1,2,3,4조 / 백팀: 5,6,7,8조)
INSERT INTO running_groups (team_id, group_name) VALUES
((SELECT id FROM teams WHERE team_name = '청팀'), '1조'),
((SELECT id FROM teams WHERE team_name = '청팀'), '2조'),
((SELECT id FROM teams WHERE team_name = '청팀'), '3조'),
((SELECT id FROM teams WHERE team_name = '청팀'), '4조'),
((SELECT id FROM teams WHERE team_name = '백팀'), '5조'),
((SELECT id FROM teams WHERE team_name = '백팀'), '6조'),
((SELECT id FROM teams WHERE team_name = '백팀'), '7조'),
((SELECT id FROM teams WHERE team_name = '백팀'), '8조');

-- 4. 관리자 계정 (비밀번호: admin1234)
INSERT INTO members (name, login_id, password, role, created_at) VALUES
('관리자1', 'admin1', '$2b$10$WtZAhFXHu59AZ/jUqiRgn.Un.e5rae/SgRDOiTGPlm9zYudUQ04ka', 'ADMIN', NOW()),
('관리자2', 'admin2', '$2b$10$WtZAhFXHu59AZ/jUqiRgn.Un.e5rae/SgRDOiTGPlm9zYudUQ04ka', 'ADMIN', NOW());

-- 5. 일반 회원 43명 (login_id=NULL, password=NULL → 최초 로그인 후 계정 설정)
INSERT INTO members (name, phone, role, team_id, group_id, created_at)

-- 청팀 1조
SELECT '임현우', '010-3098-1575', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='청팀' AND rg.group_name='1조' UNION ALL
SELECT '고수영', '010-3158-7422', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='청팀' AND rg.group_name='1조' UNION ALL
SELECT '김건이', '010-6890-0085', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='청팀' AND rg.group_name='1조' UNION ALL
SELECT '김도형', '010-5851-7034', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='청팀' AND rg.group_name='1조' UNION ALL
SELECT '노현지', '010-4861-4740', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='청팀' AND rg.group_name='1조' UNION ALL
SELECT '손우림', '010-9926-7609', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='청팀' AND rg.group_name='1조' UNION ALL

-- 청팀 2조
SELECT '김상학', '010-5323-3353', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='청팀' AND rg.group_name='2조' UNION ALL
SELECT '윤정현', '010-4094-9413', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='청팀' AND rg.group_name='2조' UNION ALL
SELECT '문유빈', '010-6381-9942', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='청팀' AND rg.group_name='2조' UNION ALL
SELECT '이시현', '010-9101-5093', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='청팀' AND rg.group_name='2조' UNION ALL
SELECT '정다은', '010-9113-8236', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='청팀' AND rg.group_name='2조' UNION ALL
SELECT '송지은', '010-2261-4260', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='청팀' AND rg.group_name='2조' UNION ALL

-- 청팀 3조
SELECT '이용희', '010-2397-2792', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='청팀' AND rg.group_name='3조' UNION ALL
SELECT '권동규', '010-6471-5326', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='청팀' AND rg.group_name='3조' UNION ALL
SELECT '임오성', '010-7327-0985', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='청팀' AND rg.group_name='3조' UNION ALL
SELECT '장수화', '010-2287-4604', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='청팀' AND rg.group_name='3조' UNION ALL
SELECT '김수연', '010-3008-1181', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='청팀' AND rg.group_name='3조' UNION ALL

-- 청팀 4조
SELECT '조세민', '010-8807-9057', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='청팀' AND rg.group_name='4조' UNION ALL
SELECT '민결',   '010-8650-0247', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='청팀' AND rg.group_name='4조' UNION ALL
SELECT '김민준', '010-4255-0909', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='청팀' AND rg.group_name='4조' UNION ALL
SELECT '이다효', '010-3937-1187', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='청팀' AND rg.group_name='4조' UNION ALL
SELECT '조율',   '010-2771-9663', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='청팀' AND rg.group_name='4조' UNION ALL

-- 백팀 5조
SELECT '양동훈', '010-7337-2670', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='백팀' AND rg.group_name='5조' UNION ALL
SELECT '이경찬', '010-9169-2889', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='백팀' AND rg.group_name='5조' UNION ALL
SELECT '이세웅', '010-2127-4267', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='백팀' AND rg.group_name='5조' UNION ALL
SELECT '양지우', '010-2696-8766', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='백팀' AND rg.group_name='5조' UNION ALL
SELECT '황수아', '010-5824-9457', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='백팀' AND rg.group_name='5조' UNION ALL
SELECT '김혜리', '010-3176-8946', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='백팀' AND rg.group_name='5조' UNION ALL

-- 백팀 6조
SELECT '전시은', '010-6412-9543', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='백팀' AND rg.group_name='6조' UNION ALL
SELECT '박남률', '010-2162-6676', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='백팀' AND rg.group_name='6조' UNION ALL
SELECT '이동준', '010-6236-8339', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='백팀' AND rg.group_name='6조' UNION ALL
SELECT '이수연', '010-3080-5580', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='백팀' AND rg.group_name='6조' UNION ALL
SELECT '허주원', '010-8295-2766', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='백팀' AND rg.group_name='6조' UNION ALL
SELECT '채민지', '010-9488-9222', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='백팀' AND rg.group_name='6조' UNION ALL

-- 백팀 7조
SELECT '서현승', '010-3762-6584', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='백팀' AND rg.group_name='7조' UNION ALL
SELECT '강동연', '010-5692-8892', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='백팀' AND rg.group_name='7조' UNION ALL
SELECT '신의중', '010-6581-2133', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='백팀' AND rg.group_name='7조' UNION ALL
SELECT '정예빈', '010-5171-3071', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='백팀' AND rg.group_name='7조' UNION ALL
SELECT '이시은', '010-4088-1692', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='백팀' AND rg.group_name='7조' UNION ALL

-- 백팀 8조
SELECT '정영헌', '010-6740-9770', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='백팀' AND rg.group_name='8조' UNION ALL
SELECT '염승민', '010-4352-1016', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='백팀' AND rg.group_name='8조' UNION ALL
SELECT '이승교', '010-8669-7053', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='백팀' AND rg.group_name='8조' UNION ALL
SELECT '서신비', '010-6274-4268', 'USER', t.id, rg.id, NOW() FROM teams t JOIN running_groups rg ON rg.team_id=t.id WHERE t.team_name='백팀' AND rg.group_name='8조';
