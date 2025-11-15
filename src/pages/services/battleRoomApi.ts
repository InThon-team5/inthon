  // src/services/battleRoomApi.ts
// 대결방 관련 API 전용 모듈

// 실제 랭크 값 (프로필 rank와 동일하게 맞추면 됨)
export type Grade = 'A+' | 'A0' | 'B+' | 'B0' | 'C+' | 'C0' | 'D+' | 'D0' | 'F';

export type BattleType = '코테' | '미니';
export type RoomStatus = '대기 중' | '진행 중';

export interface Room {
  id: number;
  type: BattleType;
  title: string;
  tier: Grade;
  currentPlayers: number;
  maxPlayers: number;
  status: RoomStatus;
  isPrivate: boolean;
}

export interface CreateRoomPayload {
  title: string;
  is_cote: boolean;
  is_private: boolean;
  private_password?: string;
  problems: number[];
}

interface BattleRoomDto {
  id: number;
  title: string;
  is_cote: boolean;
  is_private: boolean;
  status: string;
  current_players: number;
  max_players: number;
  host_rank: Grade;
}

interface JoinRoomResponse {
  match_id?: number;
}

// ✅ profileApi랑 동일한 규칙으로 base URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

// ✅ 토큰 키를 loop_access로 통일
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('loop_access');

  return token
    ? { Authorization: `Bearer ${token}` }
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

// 이하 fetchBattleRooms / createBattleRoom / verifyRoomPassword / joinBattleRoom 는
// 네가 올린 코드 그대로 두면 됨 (위의 API_BASE_URL, getAuthHeaders만 교체)


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
