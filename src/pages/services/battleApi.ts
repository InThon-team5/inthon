// src/pages/services/battleApi.ts
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function getAuthHeaders(): HeadersInit {
  const access = localStorage.getItem("loop_access");
  return access ? { Authorization: `Bearer ${access}` } : {};
}

export type ServerQuestionType = "SUBJECTIVE" | "MULTIPLE_CHOICE";

export type BattleQuestionDto = {
  id: number;
  type: ServerQuestionType;
  title: string;
  description: string;
  subject: string;
  options: string[];
  correct_option_index?: number | null;
};

export type BattleDetailResponse = {
  id: number;
  mode: "COTE" | "MINI" | "cote" | "mini" | boolean;
  duration_seconds: number;
  my_nickname: string;
  opponent_nickname: string;
  questions: BattleQuestionDto[];
};

// 백엔드에서 주는 room detail 구조
export type BattleRoomDetailResponse = {
  id: number;
  title: string;
  is_cote: boolean;
  host: {
    id: number;
    email: string;
  };
  status: {
    id: number;
    name: string;   // "대기" / "진행"
  };
  is_private: boolean;
  problems: {
    id: number;
    title: string;
    description: string;
  }[];
};

// GET /api/battles/rooms/{room_id}/
export async function fetchBattleDetail(
  roomId: number
): Promise<BattleRoomDetailResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/battles/rooms/${roomId}/`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    }
  );

  if (!res.ok) {
    throw new Error("배틀 정보를 불러오지 못했습니다.");
  }

  return (await res.json()) as BattleRoomDetailResponse;
}