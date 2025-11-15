// src/pages/MainPage.tsx
import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import "./BattlePage.css";  // Loop 공통 테마
import "./MainPage.css";    // 메인 페이지 전용 스타일
import { loginApi, signupApi } from "./services/authApi";

const KOREA_EMAIL_REGEX = /^[^\s@]+@korea\.ac\.kr$/;

export default function MainPage() {
  const navigate = useNavigate();

  // 다크 모드
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 로그인 토큰 유무 (나중에 전역 상태로 뺄 수도 있음)
  const [hasToken, setHasToken] = useState(false);

  // 로그인 / 회원가입 탭 상태
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // 로그인 폼 상태
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loginError, setLoginError] = useState("");

  // 회원가입 폼 상태
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPw, setSignupPw] = useState("");
  const [signupPwConfirm, setSignupPwConfirm] = useState("");
  const [signupNickname, setSignupNickname] = useState("");
  const [signupError, setSignupError] = useState("");

  const isLoggedIn = hasToken;

  // 새로고침해도 로그인 유지 (localStorage 기반)
  useEffect(() => {
    const access = localStorage.getItem("loop_access");
    if (access) {
      setHasToken(true);
    }
  }, []);

  const switchToLogin = () => {
    setAuthMode("login");
    setLoginError("");
    setSignupError("");
  };

  const switchToSignup = () => {
    setAuthMode("signup");
    setLoginError("");
    setSignupError("");
  };

  // 로그인 처리 (Django /api/users/login/)
  const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedId = loginId.trim();
    const trimmedPw = loginPw.trim();

    if (!trimmedId || !trimmedPw) {
      setLoginError("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    if (!KOREA_EMAIL_REGEX.test(trimmedId)) {
      setLoginError("반드시 @korea.ac.kr 이메일로 로그인해야 합니다.");
      return;
    }

    try {
      const res = await loginApi({
        email: trimmedId,
        password: trimmedPw,
      });

      // 토큰 저장
      localStorage.setItem("loop_access", res.access);
      localStorage.setItem("loop_refresh", res.refresh);

      setLoginError("");
      setHasToken(true);
    } catch (err) {
      console.error(err);
      setLoginError(
        err instanceof Error
          ? err.message
          : "로그인 중 오류가 발생했습니다."
      );
    }
  };

  // 회원가입 처리 (Django /api/users/signup/ 후 바로 로그인)
  const handleSignupSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const email = signupEmail.trim();
    const pw = signupPw.trim();
    const pw2 = signupPwConfirm.trim();
    const nick = signupNickname.trim(); // 지금은 백엔드에 안 보내지만 UI용으로 유지

    if (!email || !pw || !pw2 || !nick) {
      setSignupError("모든 정보를 입력해주세요.");
      return;
    }

    if (!KOREA_EMAIL_REGEX.test(email)) {
      setSignupError("반드시 @korea.ac.kr 이메일로 가입해야 합니다.");
      return;
    }

    if (pw.length < 8) {
      setSignupError("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }

    if (pw !== pw2) {
      setSignupError("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    try {
      // 1) 회원가입 요청 (email, password만 전송)
      await signupApi({
        email,
        password: pw,
      });

      // 2) 바로 로그인 요청해서 토큰 받기
      const loginRes = await loginApi({
        email,
        password: pw,
      });

      localStorage.setItem("loop_access", loginRes.access);
      localStorage.setItem("loop_refresh", loginRes.refresh);

      setSignupError("");
      setHasToken(true);
      setLoginId(email);
      setAuthMode("login"); // 탭은 로그인 쪽으로 돌려두기
    } catch (err) {
      console.error(err);
      setSignupError(
        err instanceof Error
          ? err.message
          : "회원가입 중 오류가 발생했습니다."
      );
    }
  };

  const handleLogout = () => {
    // 토큰 삭제
    localStorage.removeItem("loop_access");
    localStorage.removeItem("loop_refresh");

    setHasToken(false);
    setLoginId("");
    setLoginPw("");
    setSignupEmail("");
    setSignupPw("");
    setSignupPwConfirm("");
    setSignupNickname("");
    setLoginError("");
    setSignupError("");
    setAuthMode("login");
  };

  const handleEnterBattle = () => {
    navigate("/lobby");
  };

  const handleMyPage = () => {
    navigate("/me");
  };

  return (
    <div className={`loop-root ${isDarkMode ? "dark-mode" : ""}`}>
      {/* 상단 글로벌 바 */}
      <div className="loop-topbar">
        <div className="loop-brand">
          <div className="loop-logo">🔥</div>
          <span className="loop-brand-name">Loop</span>
        </div>

        <div className="loop-topbar-right">
          <button
            type="button"
            className="loop-theme-toggle"
            onClick={() => setIsDarkMode((prev) => !prev)}
          >
            <span className="loop-theme-dot" />
            <span className="loop-theme-label">
              {isDarkMode ? "Dark Mode" : "Light Mode"}
            </span>
          </button>
          <span className="loop-version">v0.1</span>
        </div>
      </div>

      {/* 메인 타이틀 영역 */}
      <main className="title-main">
        {/* 왼쪽: 소개 텍스트 */}
        <section className="title-left">
          <p className="title-kicker">코딩 배틀 플랫폼</p>
          <h1 className="title-heading">Loop</h1>
          <p className="title-description">
            친구들과 1:1로 붙어보고, 실시간으로 실력을 겨루는 코딩 배틀 공방.
            <br />
            오늘은 몇 판이나 이겨볼까요?
          </p>
        </section>

        {/* 오른쪽: 로그인/회원가입 or 메인 메뉴 */}
        <section className="title-right">
          {!isLoggedIn ? (
            // 🔐 로그인 / 회원가입 카드 (탭)
            <div className="title-card title-login-card">
              <h2 className="title-card-title">Loop 계정</h2>
              <p className="title-card-sub">
                로그인하거나 새 계정을 만들어 주세요.
              </p>

              {/* 로그인 / 회원가입 탭 */}
              <div className="auth-tabs">
                <button
                  type="button"
                  className={`auth-tab ${
                    authMode === "login" ? "active" : ""
                  }`}
                  onClick={switchToLogin}
                >
                  로그인
                </button>
                <button
                  type="button"
                  className={`auth-tab ${
                    authMode === "signup" ? "active" : ""
                  }`}
                  onClick={switchToSignup}
                >
                  회원가입
                </button>
              </div>

              {authMode === "login" ? (
                <>
                  <form
                    className="title-login-form"
                    onSubmit={handleLoginSubmit}
                  >
                    <label className="title-input-group">
                      <span className="title-input-label">아이디</span>
                      <input
                        className="title-input"
                        type="email"
                        value={loginId}
                        onChange={(e) => {
                          setLoginId(e.target.value);
                          if (loginError) setLoginError("");
                        }}
                        placeholder="example@korea.ac.kr"
                      />
                    </label>

                    <label className="title-input-group">
                      <span className="title-input-label">비밀번호</span>
                      <input
                        className="title-input"
                        type="password"
                        value={loginPw}
                        onChange={(e) => {
                          setLoginPw(e.target.value);
                          if (loginError) setLoginError("");
                        }}
                        placeholder="비밀번호를 입력하세요"
                      />
                    </label>

                    {loginError && (
                      <p className="title-error">{loginError}</p>
                    )}

                    <button type="submit" className="title-login-btn">
                      로그인
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <form
                    className="title-login-form"
                    onSubmit={handleSignupSubmit}
                  >
                    <label className="title-input-group">
                      <span className="title-input-label">학교 이메일</span>
                      <input
                        className="title-input"
                        type="email"
                        value={signupEmail}
                        onChange={(e) => {
                          setSignupEmail(e.target.value);
                          if (signupError) setSignupError("");
                        }}
                        placeholder="example@korea.ac.kr"
                      />
                    </label>

                    <label className="title-input-group">
                      <span className="title-input-label">닉네임</span>
                      <input
                        className="title-input"
                        type="text"
                        value={signupNickname}
                        onChange={(e) => {
                          setSignupNickname(e.target.value);
                          if (signupError) setSignupError("");
                        }}
                        placeholder="공방에서 사용할 닉네임"
                      />
                    </label>

                    <label className="title-input-group">
                      <span className="title-input-label">비밀번호</span>
                      <input
                        className="title-input"
                        type="password"
                        value={signupPw}
                        onChange={(e) => {
                          setSignupPw(e.target.value);
                          if (signupError) setSignupError("");
                        }}
                        placeholder="최소 8자 이상"
                      />
                    </label>

                    <label className="title-input-group">
                      <span className="title-input-label">
                        비밀번호 확인
                      </span>
                      <input
                        className="title-input"
                        type="password"
                        value={signupPwConfirm}
                        onChange={(e) => {
                          setSignupPwConfirm(e.target.value);
                          if (signupError) setSignupError("");
                        }}
                        placeholder="비밀번호를 한 번 더 입력하세요"
                      />
                    </label>

                    {signupError && (
                      <p className="title-error">{signupError}</p>
                    )}

                    <button type="submit" className="title-login-btn">
                      회원가입 완료
                    </button>
                  </form>
                </>
              )}
            </div>
          ) : (
            // ✅ 로그인 후 메인 메뉴
            <div className="title-card title-menu-card">
              <h2 className="title-card-title">다시 만나서 반가워요!</h2>
              <p className="title-card-sub">오늘도 한 판 가볼까요?</p>

              <div className="title-menu-buttons">
                <button
                  type="button"
                  className="title-big-btn title-big-btn-primary"
                  onClick={handleEnterBattle}
                >
                  공방 입장
                </button>
                <button
                  type="button"
                  className="title-big-btn"
                  onClick={handleMyPage}
                >
                  마이페이지
                </button>
              </div>

              <button
                type="button"
                className="title-logout-link"
                onClick={handleLogout}
              >
                로그아웃
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
