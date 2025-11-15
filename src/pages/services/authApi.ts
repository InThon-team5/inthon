// src/services/authApi.ts

// 백엔드 기본 주소 (.env.local 에서 설정 가능)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access: string;
  refresh: string;
};

export type SignupRequest = {
  email: string;
  password: string;
};

export type SignupResponse = {
  email: string;
};

export type RefreshResponse = {
  access: string;
};

// 공통 POST JSON 헬퍼
async function postJson<TReq, TRes>(
  path: string,
  body: TReq
): Promise<TRes> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  // ✅ 성공이면 그대로 JSON 리턴
  if (res.ok) {
    return (await res.json()) as TRes;
  }

  // ❌ 실패(400/401/500 등)면 메시지 뽑아서 Error로 던짐
  let msg = "요청 중 오류가 발생했습니다.";

  try {
    const text = await res.text(); // 우선 전체 텍스트로 읽기

    if (text) {
      try {
        const data = JSON.parse(text) as any;

        // 1) { "detail": "..." }
        if (typeof data?.detail === "string") {
          msg = data.detail;
        }
        // 2) { "message": "..." }
        else if (typeof data?.message === "string") {
          msg = data.message;
        }
        // 3) { "error": "..." }
        else if (typeof data?.error === "string") {
          msg = data.error;
        }
        // 4) DRF ValidationError 스타일: { "email": ["..."], "password": ["..."] }
        else if (data && typeof data === "object") {
          const keys = Object.keys(data);
          if (keys.length > 0) {
            const firstKey = keys[0];
            const value = data[firstKey];

            if (Array.isArray(value) && value.length > 0) {
              msg = String(value[0]); // "이미 가입된 이메일입니다." 같은 거
            } else if (typeof value === "string") {
              msg = value;
            } else {
              msg = JSON.stringify(data);
            }
          }
        } else {
          // JSON이긴 한데 위 케이스에 안 걸리면 그냥 문자열로
          msg = text;
        }
      } catch {
        // JSON 파싱 안 되면 raw text 그대로 사용
        msg = text;
      }
    }
  } catch {
    // res.text() 에서 에러 나면 기본 msg 유지
  }

  throw new Error(msg);
}

export function loginApi(req: LoginRequest) {
  // POST /api/users/login/
  return postJson<LoginRequest, LoginResponse>("/api/users/login/", req);
}

export function signupApi(req: SignupRequest) {
  // POST /api/users/signup/
  return postJson<SignupRequest, SignupResponse>("/api/users/signup/", req);
}

export function refreshTokenApi(refresh: string) {
  // POST /api/token/refresh/
  return postJson<{ refresh: string }, RefreshResponse>("/api/token/refresh/", {
    refresh,
  });
}
