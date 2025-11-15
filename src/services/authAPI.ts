// src/services/authApi.ts

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

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

  if (!res.ok) {
    let msg = "요청 중 오류가 발생했습니다.";
    try {
      const data = (await res.json()) as any;
      if (data && typeof data.detail === "string") msg = data.detail;
      else if (data && typeof data.message === "string") msg = data.message;
    } catch {
      // ignore JSON parse error
    }
    throw new Error(msg);
  }

  return (await res.json()) as TRes;
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
