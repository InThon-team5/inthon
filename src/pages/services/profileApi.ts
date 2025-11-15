// src/services/profileApi.ts

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

// ===== DTO 타입 =====
export type TitleRef = {
  id: number;
  name: string;
};

export type TechStackRef = {
  id: number;
  name: string;
};

export type ClubRef = {
  id: number;
  name: string;
};

export type Profile = {
  id: number;
  user: {
    id: number;
    email: string;
  };
  student_id: number | null;
  nickname: string;
  rating: number;
  tier: string;
  activate_title: TitleRef | null;
  titles: TitleRef[];
  tech_stacks: TechStackRef[];
  clubs: ClubRef[];
};

// PATCH /api/profile/ 에 쓸 body 타입
export type ProfilePatchRequest = {
  student_id?: number | null;
  nickname?: string;
  tier?: string;
  activate_title?: number | null;
  title_ids?: number[];
  tech_stack_ids?: number[];
  club_ids?: number[];
};

// ===== 공통 에러 파싱 =====
async function extractErrorMessage(res: Response): Promise<string> {
  let msg = "요청 중 오류가 발생했습니다.";

  try {
    const text = await res.text();
    if (!text) return msg;

    try {
      const data = JSON.parse(text) as any;

      if (typeof data?.detail === "string") return data.detail;
      if (typeof data?.message === "string") return data.message;
      if (typeof data?.error === "string") return data.error;

      if (data && typeof data === "object") {
        const keys = Object.keys(data);
        if (keys.length > 0) {
          const firstKey = keys[0];
          const value = (data as any)[firstKey];

          if (Array.isArray(value) && value.length > 0) {
            return String(value[0]);
          }
          if (typeof value === "string") return value;

          return JSON.stringify(data);
        }
      }

      return text;
    } catch {
      // JSON 아님 → 그냥 text 사용
      return text;
    }
  } catch {
    return msg;
  }
}

async function getJson<T>(path: string, token?: string): Promise<T> {
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { headers });

  if (res.ok) {
    return (await res.json()) as T;
  }

  const msg = await extractErrorMessage(res);
  throw new Error(msg);
}

async function patchJson<TReq, TRes>(
  path: string,
  body: TReq,
  token: string
): Promise<TRes> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    return (await res.json()) as TRes;
  }

  const msg = await extractErrorMessage(res);
  throw new Error(msg);
}

// ===== 실제로 쓸 함수들 =====

// 내 프로필 조회 GET /api/profile/
export function fetchProfile(accessToken: string) {
  return getJson<Profile>("/api/profile/", accessToken);
}

// 기술 스택 목록 조회 GET /api/tech-stacks/
export function fetchTechStacks() {
  return getJson<TechStackRef[]>("/api/tech-stacks/");
}

// (필요하면 이후에 칭호/동아리도 쉽게 추가 가능)
export function fetchTitles() {
  return getJson<TitleRef[]>("/api/titles/");
}

export function fetchClubs() {
  return getJson<ClubRef[]>("/api/clubs/");
}

// 프로필 수정 PATCH /api/profile/
export function updateProfile(accessToken: string, body: ProfilePatchRequest) {
  return patchJson<ProfilePatchRequest, Profile>(
    "/api/profile/",
    body,
    accessToken
  );
}
