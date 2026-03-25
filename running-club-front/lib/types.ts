// ============================================================
// 공통
// ============================================================

/**
 * 공개 API 공통 응답 래퍼.
 *
 * 이 래퍼를 사용하는 엔드포인트:
 *   POST /join
 *   GET  /api/competitions/active
 *   GET  /api/competitions/{id}/teams
 *   GET  /api/teams/{id}/groups
 *
 * 래퍼를 사용하지 않는 엔드포인트 (데이터 직접 반환):
 *   GET /api/ranking/*          → RankingItem[]
 *   GET /api/records/*          → RunningRecord[]
 *   GET /api/admin/**           → 각 타입 직접
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

/**
 * 대회 상태.
 * 백엔드에서 startDate / endDate / isActive 기반으로 런타임 계산.
 * DB에 컬럼 없음.
 */
export type CompetitionStatus = "READY" | "PROCEEDING" | "FINISHED";

/** 기록 승인 상태 */
export type RecordStatus = "WAITING" | "APPROVED" | "REJECTED";

// ============================================================
// 회원가입 지원 (공개 API — ApiResponse<T> 래퍼 사용)
// ============================================================

/**
 * GET /api/competitions/active 응답 data 배열의 각 항목.
 * READY + PROCEEDING 상태만 반환 (FINISHED는 백엔드가 필터링).
 * startDate / endDate: "YYYY-MM-DD" 문자열
 *   (application.properties: write-dates-as-timestamps=false 설정 필수)
 */
export interface CompetitionForJoin {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  status: CompetitionStatus;
}

/**
 * GET /api/competitions/{id}/teams 응답 data 배열의 각 항목.
 * colorCode: null 가능 — 색상 미지정 팀도 존재.
 */
export interface TeamForJoin {
  id: number;
  teamName: string;
  colorCode: string | null;
}

/**
 * GET /api/competitions/{id}/groups 응답 data 배열의 각 항목.
 * teamId / teamName: 대회 전체 조 목록 조회 시 팀 컨텍스트 포함.
 */
export interface GroupForJoin {
  id: number;
  groupName: string;
  teamId: number | null;
  teamName: string | null;
}

// ============================================================
// 인증 — 현재 로그인 사용자
// ============================================================

/** GET /api/me 응답 */
export interface AuthUser {
  id: number | null;      // 최초 로그인 후 계정 설정 전까지 null
  loginId: string | null; // 계정 설정 전은 null
  name: string;
  role: "USER" | "ADMIN";
  needsSetup: boolean;       // true이면 /setup-account로 리다이렉트 필요
  groupId: number | null;
  groupName: string | null;
  teamId: number | null;     // WelcomeOverlay 팀 테마용
  teamName: string | null;
  teamColorCode: string | null; // 예: "#3B82F6"
}

/**
 * GET /api/me/profile 응답.
 * 미작성 시 memberId만 있고 나머지 null.
 */
export interface MemberProfile {
  memberId: number;
  school: string | null;
  major: string | null;
  bio: string | null;
  targetDistance: number | null;
  profileImageUrl: string | null;
}

/** PUT /api/me/profile 요청 바디 — 모든 필드 선택 사항 */
export interface MemberProfileRequest {
  school?: string;
  major?: string;
  bio?: string;
  targetDistance?: number;
  profileImageUrl?: string;
}

// ============================================================
// 인증
// ============================================================

/**
 * POST /join 요청 바디 (application/json).
 * groupId(조)를 선택하면 팀·대회는 서버에서 자동 도출.
 */
export interface JoinRequest {
  loginId: string;
  password: string;
  name: string;
  groupId: number; // 필수 — 조 선택으로 팀/대회 자동 결정
}

/**
 * POST /join 성공 응답: ApiResponse<JoinResponse>
 * groupName: null = 조 미배정 상태로 가입 완료.
 */
export interface JoinResponse {
  memberId: number;
  loginId: string;
  name: string;
  teamName: string;
  groupName: string | null;
}

// ============================================================
// 개인 대시보드 (인증 필요)
// ============================================================

/**
 * GET /api/me/dashboard 응답.
 * 프로필 + 러닝 통계 + 최근 기록을 한 번에 반환.
 */
export interface MemberDashboardData {
  memberId: number;
  name: string;
  teamName: string | null;
  teamColorCode: string | null;
  groupName: string | null;
  // 프로필
  school: string | null;
  major: string | null;
  bio: string | null;
  targetDistance: number | null;
  // 통계
  currentDistance: number;
  totalRuns: number;
  memberRank: number;        // 0 = 기록 없음
  totalRankedMembers: number;
  // 팀 현황 (대시보드 팀 기여 카드)
  competitionId: number | null;  // 진행 대회 없으면 null
  teamRank: number;              // 0 = 기록 없음
  teamTotalKm: number;
  /** 오늘 러닝 여부 (APPROVED or WAITING 기록 있으면 true) */
  ranToday: boolean;
  // 최근 기록
  recentRecords: RunningRecord[];
}

// ============================================================
// 대회 현황 배틀 (공개 API)
// ============================================================

/**
 * GET /api/competitions/active/battle 응답.
 * 팀 배틀 + 조별 기여도 + 오늘의 MVP를 단일 호출로 반환.
 */
export interface CompetitionBattle {
  competitionId: number;
  title: string;
  status: "PROCEEDING" | "READY";
  startDate: string;      // "yyyy-MM-dd"
  endDate: string;        // "yyyy-MM-dd"
  daysRemaining: number;  // 음수 = 대회 종료 후
  daysUntilStart: number; // READY 상태: 시작까지 남은 일수
  teams: TeamBattleItem[];
  groupRankings: GroupContribution[];
  todayMvp: TodayMvp | null;
}

export interface TeamBattleItem {
  id: number;
  teamName: string;
  colorCode: string | null;
  totalKm: number;
  groupCount: number;
}

export interface GroupContribution {
  rank: number;
  groupId: number;
  groupName: string;
  teamId: number;
  teamName: string;
  teamColorCode: string | null;
  totalKm: number;
  recordCount: number;
  topContributor: boolean;
  memberCount: number;
  /** previousRank - currentRank. 양수=▲, 음수=▼, 0=변동없음, null=NEW */
  rankChange: number | null;
}

export interface TodayMvp {
  memberId: number;
  name: string;
  teamName: string | null;
  teamColorCode: string | null;
  groupName: string | null;
  todayKm: number;
}

// ============================================================
// 랭킹 (공개 API — 래퍼 없이 RankingItem[] 직접 반환)
// ============================================================

/**
 * GET /api/ranking/teams?competitionId={id}
 * GET /api/ranking/groups?competitionId={id}
 * GET /api/ranking/members?competitionId={id}
 * 응답 배열의 각 항목.
 *
 * entityId: 타입에 따라 팀ID / 조ID / 회원ID.
 * totalDistance: km 단위 (소수점 포함 가능).
 * recordCount: APPROVED 기록 수.
 */
export interface RankingItem {
  rank: number;
  entityId: number;
  name: string;
  totalDistance: number;
  recordCount: number;
  /** previousRank - currentRank. 양수=▲, 음수=▼, 0=변동없음, null=NEW */
  rankChange: number | null;
}

// ============================================================
// 기록 (공개 + 인증 API — 래퍼 없이 RunningRecord[] 직접 반환)
// ============================================================

/**
 * 다음 엔드포인트 모두 이 타입을 공유:
 *   GET /api/records/my         (인증 필요)
 *   GET /api/records/team/{id}  (인증 불필요)
 *   GET /api/records/group/{id} (인증 불필요)
 *   GET /api/admin/records/waiting (관리자)
 *
 * duration: 초 단위. 분 변환: Math.floor(duration / 60)
 * runningDate: "YYYY-MM-DD" (백엔드 LocalDate.toString())
 * createdAt: "YYYY-MM-DDTHH:mm:ss" ISO datetime
 * photoUrl: "http://localhost:8080/photos/uuid.jpg" 형태.
 *           null = 사진 없음.
 * teamName / groupName: null = 미배정 회원.
 */
export interface RunningRecord {
  id: number;
  distance: number;
  duration: number;
  runningDate: string;
  status: RecordStatus;
  photoUrl: string | null;
  comment: string | null;
  createdAt: string;
  userName: string;
  teamName: string | null;
  groupName: string | null;
}

// ============================================================
// 관리자 — 대회 (래퍼 없이 직접 반환)
// ============================================================

/**
 * GET /api/admin/competitions 응답 배열의 각 항목.
 * teamCount: 소속 팀 수. 0이어야 삭제 가능.
 */
export interface CompetitionSummary {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  status: CompetitionStatus;
  teamCount: number;
  createdAt: string;
}

/**
 * POST /api/admin/competitions
 * PATCH /api/admin/competitions/{id} 응답.
 */
export interface CompetitionDetail {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  status: CompetitionStatus;
  createdAt: string | null;
}

/** POST /api/admin/competitions 요청 바디 */
export interface CompetitionCreateRequest {
  title: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
}

/**
 * PATCH /api/admin/competitions/{id} 요청 바디.
 * 부분 업데이트 — undefined 필드는 기존 값 유지.
 * isActive: false → 해당 대회 강제 FINISHED 처리.
 */
export interface CompetitionUpdateRequest {
  title?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

// ============================================================
// 관리자 — 팀 (래퍼 없이 직접 반환)
// ============================================================

/**
 * GET /api/admin/competitions/{id}/teams 응답 배열의 각 항목.
 * groupCount: 소속 조 수. totalKm: 팀 누적 거리.
 */
export interface TeamSummary {
  id: number;
  teamName: string;
  colorCode: string | null;
  totalKm: number;
  groupCount: number;
}

/**
 * POST /api/admin/competitions/{id}/teams
 * PATCH /api/admin/teams/{id} 응답.
 */
export interface TeamDetail {
  id: number;
  competitionId: number;
  teamName: string;
  colorCode: string | null;
}

/** POST /api/admin/competitions/{id}/teams 요청 바디 */
export interface TeamCreateRequest {
  teamName: string;
  colorCode?: string; // 예: "#3B82F6". 생략 가능.
}

/**
 * PATCH /api/admin/teams/{id} 요청 바디.
 * 부분 업데이트 — undefined 필드는 기존 값 유지.
 */
export interface TeamUpdateRequest {
  teamName?: string;
  colorCode?: string;
}

// ============================================================
// 관리자 — 조 (래퍼 없이 직접 반환)
// ============================================================

/**
 * GET  /api/admin/teams/{id}/groups
 * POST /api/admin/teams/{id}/groups
 * PATCH /api/admin/groups/{id} 응답.
 * teamName: 소속 팀명 (프론트 표시 편의용).
 */
export interface GroupDetail {
  id: number;
  teamId: number;
  teamName: string;
  groupName: string;
}

/** POST /api/admin/teams/{id}/groups 요청 바디 */
export interface GroupCreateRequest {
  groupName: string;
}

/** PATCH /api/admin/groups/{id} 요청 바디 */
export interface GroupUpdateRequest {
  groupName: string;
}

// ============================================================
// 공지사항
// ============================================================

/** GET /api/notices 목록 항목 (content 제외 경량 DTO) */
export interface NoticeSummary {
  id: number;
  title: string;
  isPinned: boolean;
  createdAt: string; // ISO datetime
}

/** GET /api/notices/{id} 단건 */
export interface NoticeDetail {
  id: number;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

/** POST /api/admin/notices 요청 바디 */
export interface NoticeCreateRequest {
  title: string;
  content: string;
  isPinned: boolean;
}

/** PATCH /api/admin/notices/{id} 요청 바디 (부분 업데이트) */
export interface NoticeUpdateRequest {
  title?: string;
  content?: string;
  isPinned?: boolean;
}

// ============================================================
// 멤버 공개 프로필 (GET /api/members/{id}/profile)
// ============================================================

/** 다른 회원의 읽기 전용 대시보드 데이터 */
export interface MemberPublicProfileResponse {
  memberId: number;
  name: string;
  teamName: string | null;
  teamColorCode: string | null;
  groupName: string | null;
  school: string | null;
  major: string | null;
  bio: string | null;
  targetDistance: number | null;
  totalDistance: number;
  totalRuns: number;
  /** 전체 순위. 0 = 기록 없음 */
  memberRank: number;
  /** 최근 APPROVED 기록 최대 5건 (날짜 내림차순) */
  recentRecords: RunningRecord[];
}

// ============================================================
// 관리자 — 회원 관리
// ============================================================

/** GET /api/admin/members 응답 배열의 각 항목 */
export interface AdminMemberItem {
  id: number;
  loginId: string | null;
  name: string;
  phone: string | null;
  role: "USER" | "ADMIN";
  teamId: number | null;
  teamName: string | null;
  groupId: number | null;
  groupName: string | null;
  needsSetup: boolean;
  createdAt: string | null; // ISO datetime
}

/**
 * GET /api/admin/records/history 응답 배열의 각 항목.
 * APPROVED + REJECTED 처리 완료 기록.
 * approvedByName: 처리한 관리자 이름 (null = 미처리)
 * rejectedReason: 반려 사유 (REJECTED일 때만)
 */
export interface AdminHistoryDTO {
  id: number;
  distance: number;
  duration: number;
  runningDate: string;
  status: "APPROVED" | "REJECTED";
  photoUrl: string | null;
  comment: string | null;
  createdAt: string;
  userName: string;
  teamName: string | null;
  groupName: string | null;
  approvedByName: string | null;
  rejectedReason: string | null;
}

/** GET /api/groups/{id}/members 응답 배열의 각 항목 */
export interface GroupMemberDTO {
  memberId: number;
  name: string;
  totalDistance: number;
  totalRuns: number;
  /** 전체 순위. 0 = 기록 없음 */
  memberRank: number;
}

// ============================================================
// 활동 피드 (GET /api/records/recent)
// ============================================================

/** 피드 타임라인 개별 항목 */
export interface FeedItem {
  id: number;
  userName: string;
  teamName: string | null;
  teamColorCode: string | null;
  groupName: string | null;
  distance: number;
  duration: number;
  runningDate: string;   // "YYYY-MM-DD"
  createdAt: string;     // ISO datetime
}

/**
 * 하이라이트 항목 (Daily King / Rising Star 공용).
 * value: DailyKing → 오늘 km, RisingStar → 성장률 %
 */
export interface FeedHighlight {
  userName: string;
  teamName: string | null;
  teamColorCode: string | null;
  value: number;
}

/** GET /api/records/recent 응답 */
export interface RecentFeedResponse {
  records: FeedItem[];
  dailyKing: FeedHighlight | null;
  risingStar: FeedHighlight | null;
}

// ============================================================
// 빙고
// ============================================================

export type BingoSubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface BingoMissionDTO {
  id: number;
  position: number;
  title: string;
  description: string | null;
}

export interface BingoSubmissionDTO {
  id: number;
  missionId: number;
  position: number;
  missionTitle: string;
  groupId: number;
  groupName: string;
  status: BingoSubmissionStatus;
  submittedByName: string;
  submittedAt: string | null;
  verifiedAt: string | null;
  rejectReason: string | null;
  photoUrls: string[];
}

/** GET /api/bingo/board 응답 (ApiResponse.data) */
export interface BingoBoardData {
  boardId: number;
  title: string;
  size: number;
  startDate: string;
  endDate: string;
  missions: BingoMissionDTO[];
  submissions: BingoSubmissionDTO[];
  groups: { groupId: number; groupName: string }[];
}
