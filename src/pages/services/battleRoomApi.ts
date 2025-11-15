// src/services/battleRoomApi.ts
// 대결방 + 전적 관련 API 모듈

// ===== 공통 타입 =====

// 프로필 / 대결방에서 쓰는 랭크 (프로필 tier랑 동일하게 맞추기)
export type Grade =
  | 'A+'
  | 'A0'
  | 'B+'
  | 'B0'
  | 'C+'
  | 'C0'
  | 'D+'
  | 'D0'
  | 'F';

export type BattleType = '코테' | '미니';
export type RoomStatus = '대기 중' | '진행 중';

// 실제 화면에서 사용하는 Room 타입
export interface Room {
  id: number;
  type: BattleType;       // is_cote -> '코테' / '미니'
  title: string;
  tier: Grade;            // host의 rank
  currentPlayers: number; // 현재 인원
  maxPlayers: number;     // 최대 인원
  status: RoomStatus;     // '대기 중' | '진행 중'
  isPrivate: boolean;     // 비공개 여부
}

// 대결방 생성에 사용하는 payload
export interface CreateRoomPayload {
  title: string;
  is_cote: boolean;
  is_private: boolean;
  private_password?: string;
  problems: number[]; // Notion: ["problems": [1,2,3]]
}

// ===== 내부 DTO (백엔드 응답 모양) =====

// 방 목록/생성 응답용 DTO
// (백엔드 Serializer에서 이 구조에 맞게 내려주면 됨)
interface BattleRoomDto {
  id: number;
  title: string;
  is_cote: boolean;
  is_private: boolean;
  status: string;           // 예: 'WAITING', 'IN_PROGRESS'
  current_players: number;
  max_players: number;
  host_rank: Grade;         // host.profile.tier 조인해서 내려주기
  // 필요하면 host_id, host_nickname 등 추가 가능
  [key: string]: any;
}

interface JoinRoomResponse {
  match_id?: number;
}

// 전적 조회 DTO (구체 필드는 백엔드에 맞춰 자유롭게)
export interface MatchDto {
  id: number;
  [key: string]: any;
}

// 제출 생성/조회 DTO (일단 any 허용해 두고, 나중에 맞춰도 됨)
export interface SubmissionPayload {
  [key: string]: any;
}

export interface SubmissionDto {
  id: number;
  [key: string]: any;
}

// ===== 공통 유틸 =====

const API_BASE_URL =
  // Vite 기준. 환경변수 없으면 같은 오리진으로 요청
  (import.meta as any).env?.VITE_API_BASE_URL ?? '';

const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

// 로그인 시 localStorage에 저장한 키와 맞게 사용할 것
function getAuthHeaders(): Record<string, string> {
  const token =
    localStorage.getItem('accessToken') ||
    localStorage.getItem('jwt') ||
    localStorage.getItem('token');

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

function mapStatus(status: string): RoomStatus {
  if (status === 'IN_PROGRESS' || status === 'PLAYING') return '진행 중';
  return '대기 중';
}

function mapBattleType(is_cote: boolean): BattleType {
  return is_cote ? '코테' : '미니';
}

function mapRoomDto(dto: BattleRoomDto): Room {
  return {
    id: dto.id,
    title: dto.title,
    type: mapBattleType(dto.is_cote),
    isPrivate: dto.is_private,
    status: mapStatus(dto.status),
    currentPlayers: dto.current_players,
    maxPlayers: dto.max_players,
    tier: dto.host_rank,
  };
}

// ===== 대결방 메인 API =====

// ✅ 방 목록 조회: GET /api/battles/rooms/
export async function fetchBattleRooms(): Promise<Room[]> {
  const res = await fetch(apiUrl('/api/battles/rooms/'), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(), // 필요 없으면 백엔드에서 무시
    },
  });

  if (!res.ok) {
    throw new Error('방 목록을 불러오지 못했습니다.');
  }

  const data: BattleRoomDto[] = await res.json();
  return data.map(mapRoomDto);
}

// ✅ 방 생성: POST /api/battles/rooms/ (header에 JWT 필요)
export async function createBattleRoom(
  payload: CreateRoomPayload,
): Promise<Room> {
  const res = await fetch(apiUrl('/api/battles/rooms/'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(), // 🔐 JWT 필수
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('대결 방 생성에 실패했습니다.');
  }

  const dto: BattleRoomDto = await res.json();
  return mapRoomDto(dto);
}

// ✅ 비공개 방 비밀번호 확인: POST /api/battles/rooms/{room_id}/verify-password/
export async function verifyRoomPassword(
  roomId: number,
  password: string,
): Promise<void> {
  const res = await fetch(
    apiUrl(`/api/battles/rooms/${roomId}/verify-password/`),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ password }),
    },
  );

  if (!res.ok) {
    // 백엔드에서 400/401/403 등으로 내려준다고 가정
    throw new Error('비밀번호가 일치하지 않습니다.');
  }
}

// ✅ 방 입장: POST /api/battles/rooms/{room_id}/join/
export async function joinBattleRoom(
  roomId: number,
): Promise<JoinRoomResponse> {
  const res = await fetch(apiUrl(`/api/battles/rooms/${roomId}/join/`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({}), // Notion: "비밀번호일 경우 password 필요" → 우리는 별도 verify에서 처리
  });

  if (!res.ok) {
    throw new Error('대결 방 입장에 실패했습니다.');
  }

  return res.json();
}

// ✅ 방 상세 조회: GET /api/battles/rooms/{room_id}/
export async function fetchBattleRoomDetail(
  roomId: number,
): Promise<BattleRoomDto> {
  const res = await fetch(apiUrl(`/api/battles/rooms/${roomId}/`), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!res.ok) {
    throw new Error('대결 방 정보를 불러오지 못했습니다.');
  }

  return res.json();
}

// ✅ 방 상태 변경: PATCH /api/battles/rooms/{room_id}/status/
export async function updateBattleRoomStatus(
  roomId: number,
  status: number, // Notion: { "status": 2 } → 숫자 그대로 사용
): Promise<void> {
  const res = await fetch(
    apiUrl(`/api/battles/rooms/${roomId}/status/`),
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ status }),
    },
  );

  if (!res.ok) {
    throw new Error('대결 방 상태 변경에 실패했습니다.');
  }
}

// ✅ 방 삭제: DELETE /api/battles/rooms/{room_id}/
export async function deleteBattleRoom(roomId: number): Promise<void> {
  const res = await fetch(apiUrl(`/api/battles/rooms/${roomId}/`), {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
    },
  });

  if (!res.ok) {
    throw new Error('대결 방 삭제에 실패했습니다.');
  }
}

// ===== 전적 / 제출 기록 API =====

// ✅ 전적 조회: GET /api/battles/matches/{match_id}/
export async function fetchMatch(matchId: number): Promise<MatchDto> {
  const res = await fetch(apiUrl(`/api/battles/matches/${matchId}/`), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!res.ok) {
    throw new Error('전적 정보를 불러오지 못했습니다.');
  }

  return res.json();
}

// ✅ 제출 기록 생성: POST /api/battles/submissions/
export async function createSubmission(
  payload: SubmissionPayload,
): Promise<SubmissionDto> {
  const res = await fetch(apiUrl('/api/battles/submissions/'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('제출 기록 생성에 실패했습니다.');
  }

  return res.json();
}

// ✅ 제출 기록 조회: GET /api/battles/submissions/?match_id={id}&user_id={id}
export async function fetchSubmissions(params: {
  match_id: number;
  user_id: number;
}): Promise<SubmissionDto[]> {
  const query = new URLSearchParams({
    match_id: String(params.match_id),
    user_id: String(params.user_id),
  }).toString();

  const res = await fetch(apiUrl(`/api/battles/submissions/?${query}`), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!res.ok) {
    throw new Error('제출 기록을 불러오지 못했습니다.');
  }

  return res.json();
}
