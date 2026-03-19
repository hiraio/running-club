import type {
  ApiResponse,
  AuthUser,
  CompetitionBattle,
  MemberProfile,
  MemberProfileRequest,
  MemberDashboardData,
  MemberPublicProfileResponse,
  AdminHistoryDTO,
  AdminMemberItem,
  GroupMemberDTO,
  CompetitionForJoin,
  TeamForJoin,
  GroupForJoin,
  JoinRequest,
  JoinResponse,
  RankingItem,
  RunningRecord,
  CompetitionSummary,
  CompetitionDetail,
  CompetitionCreateRequest,
  CompetitionUpdateRequest,
  TeamSummary,
  TeamDetail,
  TeamCreateRequest,
  TeamUpdateRequest,
  GroupDetail,
  GroupCreateRequest,
  GroupUpdateRequest,
  NoticeSummary,
  NoticeDetail,
  NoticeCreateRequest,
  RecentFeedResponse,
} from "./types";

// ============================================================
// 설정
// ============================================================

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/**
 * 사진 URL이 상대경로(/photos/...)인 경우 백엔드 BASE URL을 붙여 절대경로로 변환.
 * 이미 절대경로(http/https)면 그대로 반환.
 */
export function resolvePhotoUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BASE}${url}`;
}

/**
 * 모든 fetch에 기본으로 붙는 옵션.
 * credentials: "include" — JSESSIONID 쿠키 자동 포함.
 * 이게 없으면 로그인해도 다음 요청에서 401 반환.
 */
const DEFAULT_OPTS: RequestInit = {
  credentials: "include",
};

// ============================================================
// 내부 헬퍼
// ============================================================

/**
 * JSON body를 가진 변경 요청 (POST / PATCH / PUT).
 * Content-Type은 이 함수에서만 설정 — fetch 직접 호출 시 절대 설정 금지
 * (multipart/form-data는 브라우저가 boundary를 자동으로 추가해야 하므로 예외).
 */
const jsonRequest = (
  method: string,
  url: string,
  body: unknown
): Promise<Response> =>
  fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });

/**
 * 에러 응답을 일관된 Error 객체로 변환.
 * 백엔드 ApiResponse.message 또는 HTTP 상태 텍스트를 메시지로 사용.
 */
const handleError = async (res: Response): Promise<never> => {
  let message = `${res.status} ${res.statusText}`;
  try {
    const body = await res.json();
    if (body?.message) message = body.message;
  } catch {
    // JSON 파싱 실패 시 기본 메시지 사용
  }
  throw new Error(message);
};

// ============================================================
// 인증
// ============================================================

/**
 * 일반 로그인 (loginId + password, JSON).
 * 성공 시 JSESSIONID 쿠키 세팅 후 AuthUser 반환.
 * 실패 시 null 반환.
 */
export const login = async (
  loginId: string,
  password: string
): Promise<AuthUser | null> => {
  const res = await jsonRequest("POST", `${BASE}/api/auth/login`, { loginId, password });
  if (!res.ok) return null;
  return res.json();
};

/**
 * 최초 로그인 (이름 + 전화번호).
 * DB에 미리 등록된 사용자용. 성공 시 세션 수립.
 * needsSetup=true이면 /setup-account로 이동 필요.
 *
 * @throws Error("ALREADY_REGISTERED") — loginId가 이미 설정된 사용자
 * @throws Error("NOT_FOUND") — 이름/전화 불일치
 */
export const firstLogin = async (
  name: string,
  phone: string
): Promise<AuthUser> => {
  const res = await jsonRequest("POST", `${BASE}/api/auth/first-login`, { name, phone });
  if (!res.ok) {
    let msg = "NOT_FOUND";
    try {
      const body = await res.json();
      if (body?.message === "ALREADY_REGISTERED") msg = "ALREADY_REGISTERED";
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json();
};

/**
 * 계정 설정 (최초 로그인 후 loginId + password 등록).
 * 인증된 상태에서만 호출 가능.
 * 성공 시 needsSetup=false인 AuthUser 반환.
 */
export const setupAccount = async (
  loginId: string,
  password: string
): Promise<AuthUser> => {
  const res = await jsonRequest("POST", `${BASE}/api/auth/setup-account`, { loginId, password });
  if (!res.ok) await handleError(res);
  return res.json();
};

/**
 * 현재 로그인 사용자 정보 조회.
 * 미인증 시 null 반환 (401).
 */
export const getMe = async (): Promise<AuthUser | null> => {
  try {
    const res = await fetch(`${BASE}/api/me`, DEFAULT_OPTS);
    if (res.status === 401 || !res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
};

/**
 * 로그아웃.
 * Spring Security /logout POST → 서버 세션 무효화.
 * 이후 모든 인증 필요 요청은 401 반환.
 */
export const logout = (): Promise<void> =>
  fetch(`${BASE}/logout`, { method: "POST", credentials: "include" }).then(
    () => undefined
  );

/**
 * 회원가입.
 *
 * 검증 순서 (백엔드):
 * 1. loginId 중복 → 400 "이미 존재하는 아이디입니다."
 * 2. teamId 없음 / 종료 대회 소속 팀 → 400
 * 3. groupId가 해당 팀 소속이 아님 → 400 (cross-team injection 방지)
 *
 * @throws Error — 백엔드 400 시 message 필드를 에러 메시지로 throw
 */
export const join = async (
  data: JoinRequest
): Promise<ApiResponse<JoinResponse>> => {
  const res = await jsonRequest("POST", `${BASE}/join`, data);
  const body: ApiResponse<JoinResponse> = await res.json();
  if (!body.success) throw new Error(body.message ?? "회원가입 실패");
  return body;
};

// ============================================================
// 내 프로필
// ============================================================

/**
 * 개인 대시보드 데이터 (프로필 + 통계 + 최근기록 통합).
 * 단일 API 호출로 대시보드에 필요한 모든 데이터 수신.
 */
export const getMyDashboard = async (): Promise<MemberDashboardData> => {
  const res = await fetch(`${BASE}/api/me/dashboard`, DEFAULT_OPTS);
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) await handleError(res);
  return res.json();
};

/**
 * 현재 사용자 프로필 조회.
 * 미작성 시 memberId만 있고 나머지 null.
 */
export const getMemberProfile = async (): Promise<MemberProfile> => {
  const res = await fetch(`${BASE}/api/me/profile`, DEFAULT_OPTS);
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) await handleError(res);
  return res.json();
};

/**
 * 프로필 저장 (upsert).
 * null 필드는 기존 값 유지 (부분 업데이트).
 */
export const updateMemberProfile = async (
  data: MemberProfileRequest
): Promise<MemberProfile> => {
  const res = await jsonRequest("PUT", `${BASE}/api/me/profile`, data);
  if (!res.ok) await handleError(res);
  return res.json();
};

// ============================================================
// 공개 — 대회 현황 배틀
// ============================================================

/**
 * 현재 진행 중인 대회의 배틀 현황 (팀 배틀 + 조 기여도 + 오늘의 MVP).
 * 인증 불필요 — permitAll 적용.
 * 진행 중인 대회가 없으면 400 에러.
 */
export const getCompetitionBattle = async (): Promise<CompetitionBattle> => {
  const res = await fetch(`${BASE}/api/competitions/active/battle`, DEFAULT_OPTS);
  if (!res.ok) await handleError(res);
  return res.json();
};

// ============================================================
// 공개 — 회원가입 지원
// ============================================================

/**
 * 활성 대회 목록 조회.
 * READY(시작 전) + PROCEEDING(진행 중) 상태만 반환.
 * 빈 배열 = 현재 활성 대회 없음 (정상 응답).
 */
export const getActiveCompetitions = async (): Promise<
  ApiResponse<CompetitionForJoin[]>
> => {
  const res = await fetch(`${BASE}/api/competitions/active`, DEFAULT_OPTS);
  return res.json();
};

/** 전체 대회 목록 (PROCEEDING / READY / FINISHED 모두 포함). */
export const getAllCompetitions = async (): Promise<
  ApiResponse<CompetitionSummary[]>
> => {
  const res = await fetch(`${BASE}/api/competitions`, DEFAULT_OPTS);
  return res.json();
};

/**
 * 대회별 팀 목록 조회.
 *
 * 실패 케이스:
 * - 존재하지 않는 competitionId → 400
 * - 종료된 대회 → 400 "종료된 대회입니다. 팀 목록을 조회할 수 없습니다."
 */
export const getTeamsByCompetition = async (
  competitionId: number
): Promise<ApiResponse<TeamForJoin[]>> => {
  const res = await fetch(
    `${BASE}/api/competitions/${competitionId}/teams`,
    DEFAULT_OPTS
  );
  return res.json();
};

/**
 * 대회 전체 조 목록 조회 (팀명 포함).
 * 회원가입 시 대회 선택 → 조 선택 단계에서 사용.
 * 빈 배열 = 조 미구성.
 */
export const getGroupsByCompetition = async (
  competitionId: number
): Promise<ApiResponse<GroupForJoin[]>> => {
  const res = await fetch(`${BASE}/api/competitions/${competitionId}/groups`, DEFAULT_OPTS);
  return res.json();
};

/**
 * 팀별 조 목록 조회 (관리자 용도 등에서 필요 시 사용).
 */
export const getGroupsByTeam = async (
  teamId: number
): Promise<ApiResponse<GroupForJoin[]>> => {
  const res = await fetch(`${BASE}/api/teams/${teamId}/groups`, DEFAULT_OPTS);
  return res.json();
};

// ============================================================
// 공개 — 랭킹
// ============================================================

/**
 * 팀 랭킹 조회.
 * competitionId 없음 → 전체 대회 통합 집계
 * competitionId 있음 → 해당 대회 기준 집계
 *
 * 존재하지 않는 competitionId → 백엔드 400 → 빈 배열 대신 에러 throw
 */
export const getTeamRanking = async (
  competitionId?: number
): Promise<RankingItem[]> => {
  const url = competitionId
    ? `${BASE}/api/ranking/teams?competitionId=${competitionId}`
    : `${BASE}/api/ranking/teams`;
  const res = await fetch(url, DEFAULT_OPTS);
  if (!res.ok) await handleError(res);
  return res.json();
};

/** 조 랭킹 조회. competitionId 선택. */
export const getGroupRanking = async (
  competitionId?: number
): Promise<RankingItem[]> => {
  const url = competitionId
    ? `${BASE}/api/ranking/groups?competitionId=${competitionId}`
    : `${BASE}/api/ranking/groups`;
  const res = await fetch(url, DEFAULT_OPTS);
  if (!res.ok) await handleError(res);
  return res.json();
};

/** 개인 랭킹 조회. competitionId 선택. */
export const getMemberRanking = async (
  competitionId?: number
): Promise<RankingItem[]> => {
  const url = competitionId
    ? `${BASE}/api/ranking/members?competitionId=${competitionId}`
    : `${BASE}/api/ranking/members`;
  const res = await fetch(url, DEFAULT_OPTS);
  if (!res.ok) await handleError(res);
  return res.json();
};

// ============================================================
// 기록
// ============================================================

/**
 * 내 기록 조회 (인증 필요).
 * 401 → UNAUTHORIZED 에러 throw → 호출 측에서 로그인 페이지로 리다이렉트.
 */
export const getMyRecords = async (): Promise<RunningRecord[]> => {
  const res = await fetch(`${BASE}/api/records/my`, DEFAULT_OPTS);
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) await handleError(res);
  return res.json();
};

/** 팀별 기록 조회 (인증 불필요). */
export const getTeamRecords = async (
  teamId: number
): Promise<RunningRecord[]> => {
  const res = await fetch(`${BASE}/api/records/team/${teamId}`, DEFAULT_OPTS);
  if (!res.ok) await handleError(res);
  return res.json();
};

/** 조별 기록 조회 (인증 불필요). */
export const getGroupRecords = async (
  groupId: number
): Promise<RunningRecord[]> => {
  const res = await fetch(
    `${BASE}/api/records/group/${groupId}`,
    DEFAULT_OPTS
  );
  if (!res.ok) await handleError(res);
  return res.json();
};

/**
 * 기록 + 사진 업로드 (인증 필요).
 *
 * ⚠️ Content-Type 헤더를 절대 설정하지 말 것.
 * multipart/form-data는 브라우저가 boundary를 자동으로 추가하는데,
 * 수동으로 Content-Type 설정 시 boundary가 빠져서 서버가 파싱 실패.
 *
 * duration: 초 단위 (프론트에서 분으로 입력받으면 × 60)
 */
export const uploadRecord = async (data: {
  distance: number;
  duration: number;   // 초 단위
  runningDate: string; // "YYYY-MM-DD"
  comment?: string;
  file: File;
}): Promise<string> => {
  const formData = new FormData();
  formData.append("distance", String(data.distance));
  formData.append("duration", String(data.duration));
  formData.append("runningDate", data.runningDate);
  if (data.comment) formData.append("comment", data.comment);
  formData.append("file", data.file);

  const res = await fetch(`${BASE}/api/records`, {
    method: "POST",
    body: formData,
    credentials: "include",
    // Content-Type 헤더 설정 없음 — 브라우저 자동 처리
  });

  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "업로드 실패");
  }
  return res.text();
};

// ============================================================
// 관리자 — 대회
// ============================================================

/** 대회 전체 목록 + 팀 수 포함 (관리자 전용). */
export const getAdminCompetitions = async (): Promise<CompetitionSummary[]> => {
  const res = await fetch(`${BASE}/api/admin/competitions`, DEFAULT_OPTS);
  if (!res.ok) await handleError(res);
  return res.json();
};

/** 대회 생성. */
export const createCompetition = async (
  data: CompetitionCreateRequest
): Promise<CompetitionDetail> => {
  const res = await jsonRequest(
    "POST",
    `${BASE}/api/admin/competitions`,
    data
  );
  if (!res.ok) await handleError(res);
  return res.json();
};

/**
 * 대회 수정 (부분 업데이트).
 * 보내지 않은 필드는 기존 값 유지.
 * isActive: false 전송 → 해당 대회 강제 종료.
 */
export const updateCompetition = async (
  id: number,
  data: CompetitionUpdateRequest
): Promise<CompetitionDetail> => {
  const res = await jsonRequest(
    "PATCH",
    `${BASE}/api/admin/competitions/${id}`,
    data
  );
  if (!res.ok) await handleError(res);
  return res.json();
};

/**
 * 대회 삭제.
 * 소속 팀이 1개라도 있으면 400 "소속 팀이 존재하는 대회는 삭제할 수 없습니다."
 */
export const deleteCompetition = async (id: number): Promise<string> => {
  const res = await fetch(`${BASE}/api/admin/competitions/${id}`, {
    ...DEFAULT_OPTS,
    method: "DELETE",
  });
  if (!res.ok) await handleError(res);
  return res.text();
};

// ============================================================
// 관리자 — 팀
// ============================================================

/** 대회별 팀 목록 + 조 수 포함. */
export const getAdminTeams = async (
  competitionId: number
): Promise<TeamSummary[]> => {
  const res = await fetch(
    `${BASE}/api/admin/competitions/${competitionId}/teams`,
    DEFAULT_OPTS
  );
  if (!res.ok) await handleError(res);
  return res.json();
};

/** 팀 생성. */
export const createTeam = async (
  competitionId: number,
  data: TeamCreateRequest
): Promise<TeamDetail> => {
  const res = await jsonRequest(
    "POST",
    `${BASE}/api/admin/competitions/${competitionId}/teams`,
    data
  );
  if (!res.ok) await handleError(res);
  return res.json();
};

/**
 * 팀 수정 (부분 업데이트).
 * 보내지 않은 필드는 기존 값 유지.
 */
export const updateTeam = async (
  teamId: number,
  data: TeamUpdateRequest
): Promise<TeamDetail> => {
  const res = await jsonRequest(
    "PATCH",
    `${BASE}/api/admin/teams/${teamId}`,
    data
  );
  if (!res.ok) await handleError(res);
  return res.json();
};

/**
 * 팀 삭제.
 * 소속 멤버 존재 시 400.
 * 소속 조는 Cascade로 자동 삭제.
 */
export const deleteTeam = async (teamId: number): Promise<string> => {
  const res = await fetch(`${BASE}/api/admin/teams/${teamId}`, {
    ...DEFAULT_OPTS,
    method: "DELETE",
  });
  if (!res.ok) await handleError(res);
  return res.text();
};

// ============================================================
// 관리자 — 조
// ============================================================

/** 팀별 조 목록. */
export const getAdminGroups = async (
  teamId: number
): Promise<GroupDetail[]> => {
  const res = await fetch(
    `${BASE}/api/admin/teams/${teamId}/groups`,
    DEFAULT_OPTS
  );
  if (!res.ok) await handleError(res);
  return res.json();
};

/** 조 생성. */
export const createGroup = async (
  teamId: number,
  data: GroupCreateRequest
): Promise<GroupDetail> => {
  const res = await jsonRequest(
    "POST",
    `${BASE}/api/admin/teams/${teamId}/groups`,
    data
  );
  if (!res.ok) await handleError(res);
  return res.json();
};

/** 조 수정. */
export const updateGroup = async (
  groupId: number,
  data: GroupUpdateRequest
): Promise<GroupDetail> => {
  const res = await jsonRequest(
    "PATCH",
    `${BASE}/api/admin/groups/${groupId}`,
    data
  );
  if (!res.ok) await handleError(res);
  return res.json();
};

/**
 * 조 삭제.
 * 소속 멤버 존재 시 400.
 */
export const deleteGroup = async (groupId: number): Promise<string> => {
  const res = await fetch(`${BASE}/api/admin/groups/${groupId}`, {
    ...DEFAULT_OPTS,
    method: "DELETE",
  });
  if (!res.ok) await handleError(res);
  return res.text();
};

// ============================================================
// 관리자 — 기록 승인
// ============================================================

/**
 * 처리 완료 기록 히스토리 (APPROVED + REJECTED, 최신순).
 * 날짜·이름·상태 필터링은 프론트에서 처리.
 */
/** GET /api/admin/members — 전체 회원 목록 (팀/조 포함) */
export const getAdminMembers = async (): Promise<AdminMemberItem[]> => {
  const res = await fetch(`${BASE}/api/admin/members`, DEFAULT_OPTS);
  if (!res.ok) await handleError(res);
  return res.json();
};

/** PATCH /api/admin/members/{id}/assign — 팀/조 배정 (null = 해제) */
export const assignMember = async (
  memberId: number,
  body: { teamId: number | null; groupId: number | null }
): Promise<AdminMemberItem> => {
  const res = await jsonRequest("PATCH", `${BASE}/api/admin/members/${memberId}/assign`, body);
  if (!res.ok) await handleError(res);
  return res.json();
};

export const getApprovalHistory = async (): Promise<AdminHistoryDTO[]> => {
  const res = await fetch(`${BASE}/api/admin/records/history`, DEFAULT_OPTS);
  if (!res.ok) await handleError(res);
  return res.json();
};

/**
 * 승인 대기 기록 목록.
 * status === "WAITING" 인 기록만 반환.
 */
export const getWaitingRecords = async (): Promise<RunningRecord[]> => {
  const res = await fetch(`${BASE}/api/admin/records/waiting`, DEFAULT_OPTS);
  if (!res.ok) await handleError(res);
  return res.json();
};

/**
 * 기록 승인.
 * 이미 처리된 기록(APPROVED/REJECTED) → 400 "승인 실패: 이미 처리된 기록입니다."
 */
export const approveRecord = async (id: number): Promise<string> => {
  const res = await fetch(`${BASE}/api/admin/records/${id}/approve`, {
    ...DEFAULT_OPTS,
    method: "PATCH",
  });
  if (!res.ok) await handleError(res);
  return res.text();
};

/**
 * 기록 반려.
 * reason: 반려 사유 (쿼리 파라미터로 전달).
 * 이미 처리된 기록 → 400.
 */
export const rejectRecord = async (
  id: number,
  reason: string
): Promise<string> => {
  const res = await fetch(
    `${BASE}/api/admin/records/${id}/reject?reason=${encodeURIComponent(reason)}`,
    { ...DEFAULT_OPTS, method: "PATCH" }
  );
  if (!res.ok) await handleError(res);
  return res.text();
};

// ============================================================
// 공지사항
// ============================================================

/** GET /api/notices — 목록 (인증 불필요) */
export const getNotices = async (): Promise<NoticeSummary[]> => {
  const res = await fetch(`${BASE}/api/notices`, DEFAULT_OPTS);
  if (!res.ok) await handleError(res);
  const body: ApiResponse<NoticeSummary[]> = await res.json();
  return body.data;
};

/** GET /api/notices/{id} — 단건 (인증 불필요) */
export const getNotice = async (id: number): Promise<NoticeDetail> => {
  const res = await fetch(`${BASE}/api/notices/${id}`, DEFAULT_OPTS);
  if (!res.ok) await handleError(res);
  const body: ApiResponse<NoticeDetail> = await res.json();
  return body.data;
};

// ============================================================
// 멤버 공개 프로필
// ============================================================

/** 다른 회원의 공개 프로필 조회 (로그인 필요). */
export const getMemberPublicProfile = async (
  id: number
): Promise<MemberPublicProfileResponse> => {
  const res = await fetch(`${BASE}/api/members/${id}/profile`, DEFAULT_OPTS);
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) await handleError(res);
  const body: ApiResponse<MemberPublicProfileResponse> = await res.json();
  return body.data;
};

/** 조 전체 멤버 목록 + 달리기 통계 (로그인 필요). */
export const getGroupMembers = async (
  groupId: number
): Promise<GroupMemberDTO[]> => {
  const res = await fetch(`${BASE}/api/groups/${groupId}/members`, DEFAULT_OPTS);
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) await handleError(res);
  const body: ApiResponse<GroupMemberDTO[]> = await res.json();
  return body.data;
};

/** GET /api/records/recent — 활동 피드 (인증 불필요) */
export const getRecentFeed = async (): Promise<RecentFeedResponse> => {
  const res = await fetch(`${BASE}/api/records/recent`, DEFAULT_OPTS);
  if (!res.ok) await handleError(res);
  return res.json();
};

/** POST /api/admin/notices — 생성 (관리자) */
export const createNotice = async (
  request: NoticeCreateRequest
): Promise<NoticeDetail> => {
  const res = await jsonRequest("POST", `${BASE}/api/admin/notices`, request);
  if (!res.ok) await handleError(res);
  return res.json();
};

/** DELETE /api/admin/notices/{id} — 삭제 (관리자) */
export const deleteNotice = async (id: number): Promise<void> => {
  const res = await fetch(`${BASE}/api/admin/notices/${id}`, {
    ...DEFAULT_OPTS,
    method: "DELETE",
  });
  if (!res.ok) await handleError(res);
};
