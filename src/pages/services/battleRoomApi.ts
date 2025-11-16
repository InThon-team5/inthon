// src/services/battleRoomApi.ts
// 대결방 관련 API 전용 모듈

// ===== 공통 타입 =====

export type Grade =
  | "A+"
  | "A0"
  | "B+"
  | "B0"
  | "C+"
  | "C0"
  | "D+"
  | "D0"
  | "F";

export type BattleType = "코테" | "미니";
export type RoomStatus = "대기" | "진행";

export interface Room {
  id: number;
  type: BattleType;
  title: string;
  tier: Grade;            // host의 rank
  currentPlayers: number;
  maxPlayers: number;
  status: RoomStatus;     // '대기' | '진행'
  isPrivate: boolean;
}

export interface CreateRoomPayload {
  title: string;
  is_cote: boolean;
  is_private: boolean;
  private_password?: string;
  problems: number[];
}

// 백엔드 DTO
interface BattleRoomDto {
  id: number;
  title: string;
  is_cote: boolean;
  is_private: boolean;
  status: string;            // "WAITING" | "IN_PROGRESS"
  current_players: number;
  max_players: number;
  host_rank?: Grade;
}

// 방 입장 응답 (join)
export type JoinRoomResponse = {
  id: number; // ✅ match_id
  room: {
    id: number;
    title: string;
    is_cote: boolean;
    status: { id: number; name: string };
    is_private: boolean;
    problems: {
      id: number;
      title: string;
      description: string;
    }[];
  };
  guest: {
    id: number;
    email: string;
  } | null;
  winner: null | {
    id: number;
    email: string;
  };
};

// 결과 전송 응답
export type SubmitResultBodyBase = {
  remaining_time_percent: number;
  accuracy_percent: number;
};

export type SubmitResultResponse = {
  message: string;
  my_result: {
    id: number;
    user: { id: number; email: string };
    remaining_time_percent: number;
    accuracy_percent: number;
    total_score: number;
    result: "win" | "lose" | "draw";
    submitted_at: string;
  };
  opponent_result?: {
    id: number;
    user: { id: number; email: string };
    remaining_time_percent: number;
    accuracy_percent: number;
    total_score: number;
    result: "win" | "lose" | "draw";
    submitted_at: string;
  };
  is_complete: boolean;
  my_result_status?: "win" | "lose" | "draw";
  opponent_result_status?: "win" | "lose" | "draw";
};

// ===== 공통 유틸 =====

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("loop_access");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function mapStatus(status: string): RoomStatus {
  if (status === "IN_PROGRESS" || status === "PLAYING") return "진행";
  return "대기";
}

function mapBattleType(is_cote: boolean): BattleType {
  return is_cote ? "코테" : "미니";
}

function mapRoomDto(dto: BattleRoomDto): Room {
  const tier: Grade = dto.host_rank ?? "F";
  return {
    id: dto.id,
    title: dto.title,
    type: mapBattleType(dto.is_cote),
    isPrivate: dto.is_private,
    status: mapStatus(dto.status),
    currentPlayers: dto.current_players,
    maxPlayers: dto.max_players,
    tier,
  };
}

// ===== API 함수들 =====

// 방 목록
export async function fetchBattleRooms(): Promise<Room[]> {
  const res = await fetch(`${API_BASE_URL}/api/battles/rooms/`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  if (!res.ok) {
    throw new Error("방 목록을 불러오지 못했습니다.");
  }

  const data: BattleRoomDto[] = await res.json();
  return data.map(mapRoomDto);
}

// 방 생성
export async function createBattleRoom(
  payload: CreateRoomPayload
): Promise<Room> {
  const res = await fetch(`${API_BASE_URL}/api/battles/rooms/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("대결 방 생성에 실패했습니다.");
  }

  const dto: BattleRoomDto = await res.json();
  return mapRoomDto(dto);
}

// 비공개 방 비밀번호 확인
export async function verifyRoomPassword(
  roomId: number,
  password: string
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/api/battles/rooms/${roomId}/verify-password/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ password }),
    }
  );

  if (!res.ok) {
    throw new Error("비밀번호가 일치하지 않습니다.");
  }
}

// 방 입장 (join)
export async function joinBattleRoom(
  roomId: number,
  password?: string
): Promise<JoinRoomResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/battles/rooms/${roomId}/join/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(password ? { password } : {}),
    }
  );

  if (!res.ok) {
    throw new Error("방 입장에 실패했습니다.");
  }

  const data = (await res.json()) as JoinRoomResponse;
  console.log("[joinBattleRoom] response =", data);
  return data;
}

// 결과 전송 (submit-result)
//   POST /api/battles/rooms/{room_id}/submit-result/
export async function submitBattleResult(
  roomId: number,
  body: SubmitResultBodyBase
): Promise<SubmitResultResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/battles/rooms/${roomId}/submit-result/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    throw new Error("결과 전송에 실패했습니다.");
  }

  return (await res.json()) as SubmitResultResponse;
}

// 결과 조회 (get-result)
//   GET /api/battles/rooms/{room_id}/result/
export type GetResultResponse = {
  message?: string;
  my_result: {
    id: number;
    user: { id: number; email: string };
    remaining_time_percent: number;
    accuracy_percent: number;
    total_score: number;
    result: "win" | "lose" | "draw" | null;
    submitted_at: string;
  } | null;
  opponent_result: {
    id: number;
    user: { id: number; email: string };
    remaining_time_percent: number;
    accuracy_percent: number;
    total_score: number;
    result: "win" | "lose" | "draw" | null;
    submitted_at: string;
  } | null;
  is_complete: boolean;
  my_result_status?: "win" | "lose" | "draw";
  opponent_result_status?: "win" | "lose" | "draw";
  result?: "win" | "lose" | "draw";
};

export async function getBattleResult(
  roomId: number
): Promise<GetResultResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/battles/rooms/${roomId}/result/`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    }
  );

  if (!res.ok) {
    throw new Error("결과 조회에 실패했습니다.");
  }

  return (await res.json()) as GetResultResponse;
}

