// src/services/battleRoomApi.ts
// 대결방 관련 API 전용 모듈

// 실제 랭크 값 (프로필 rank와 동일하게 맞추면 됨)
export type Grade = 'A+' | 'A0' | 'B+' | 'B0' | 'C+' | 'C0' | 'D+' | 'D0' | 'F';

export type BattleType = '코테' | '미니';
export type RoomStatus = '대기 중' | '진행 중';

export interface Room {
  id: number;
  type: BattleType;         // is_cote -> '코테' / '미니'
  title: string;
  tier: Grade;              // host의 rank
  currentPlayers: number;   // 현재 인원
  maxPlayers: number;       // 최대 인원
  status: RoomStatus;       // '대기 중' | '진행 중'
  isPrivate: boolean;       // 비공개 여부
}

export interface CreateRoomPayload {
  title: string;
  is_cote: boolean;
  is_private: boolean;
  private_password?: string;
  problems: number[];       // 아직은 빈 배열로 보내도 되고, 나중에 문제 선택 붙이면 됨
}

// 백엔드에서 방 목록에 내려줄 DTO 형태 (추정)
// 필요하면 여기에 필드 더 추가해서 써도 됨 (host_id, host_nickname 등)
interface BattleRoomDto {
  id: number;
  title: string;
  is_cote: boolean;
  is_private: boolean;
  status: string;              // 예: 'WAITING', 'IN_PROGRESS' 등
  current_players: number;
  max_players: number;
  host_rank: Grade;            // host 프로필 rank 조인해서 내려주기
  // host_id?: number;
  // host_nickname?: string;
}

interface JoinRoomResponse {
  // 백엔드에서 실제로 내려줄 값에 맞춰 수정
  match_id?: number;
}

const API_BASE_URL =
  // Vite 기준. 환경변수 없으면 상대 경로로 요청
  import.meta?.env?.VITE_API_BASE_URL ?? '';

function getAuthHeaders(): Record<string, string> {
  // 로그인할 때 localStorage에 저장한 키와 맞추기
  const token = localStorage.getItem('jwt') || localStorage.getItem('token');
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

function mapStatus(status: string): RoomStatus {
  // 백엔드 enum에 맞게 알아서 변환
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
    tier: dto.host_rank, // 백엔드에서 host_rank를 rank 문자열로 내려주기
  };
}

// ✅ 방 목록 조회: GET /api/battles/rooms/
export async function fetchBattleRooms(): Promise<Room[]> {
  const res = await fetch(`${API_BASE_URL}/api/battles/rooms/`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!res.ok) {
    throw new Error('방 목록을 불러오지 못했습니다.');
  }

  const data: BattleRoomDto[] = await res.json();
  return data.map(mapRoomDto);
}

// ✅ 방 생성: POST /api/battles/rooms/
export async function createBattleRoom(
  payload: CreateRoomPayload,
): Promise<Room> {
  const res = await fetch(`${API_BASE_URL}/api/battles/rooms/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(), // JWT 필요
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
    `${API_BASE_URL}/api/battles/rooms/${roomId}/verify-password/`,
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
    // 400/401/403 등으로 실패 내려준다고 가정
    throw new Error('비밀번호가 일치하지 않습니다.');
  }
}

// ✅ 방 입장: POST /api/battles/rooms/{room_id}/join/
export async function joinBattleRoom(
  roomId: number,
): Promise<JoinRoomResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/battles/rooms/${roomId}/join/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({}), // body 필요 없으면 비워두기
    },
  );

  if (!res.ok) {
    throw new Error('대결 방 입장에 실패했습니다.');
  }

  return res.json();
}
