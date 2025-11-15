// MyPage.tsx
import "bootstrap/dist/css/bootstrap.min.css";
import "./Mypage.css";
import { useState } from "react";

export default function MyPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const recentRecords = [
    { id: 1, title: "코딩 배틀 vs 홍길동", date: "2025-11-10", result: "WIN" },
    { id: 2, title: "나 vs 너", date: "2025-11-09", result: "LOSE" },
  ];

  // 선택된 기술 스택
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [isTechEditorOpen, setIsTechEditorOpen] = useState(false);

  // 닉네임
  const [nickname, setNickname] = useState("NickName");
  const [tempNickname, setTempNickname] = useState(nickname);
  const [isNicknameEditorOpen, setIsNicknameEditorOpen] = useState(false);

  // 티어 정보 (멘트 포함)
  const Rank = [
    { id: 1, title: "F", min: 0, max: 399, explain: "코딩의 재앙" },
    { id: 2, title: "D0", min: 400, max: 699, explain: "코딩의 순수 입문자" },
    { id: 3, title: "D+", min: 700, max: 999, explain: "while(true) { 노력 중; }" },
    { id: 4, title: "C0", min: 1000, max: 1299, explain: "코딩의 새싹 개발자" },
    { id: 5, title: "C+", min: 1300, max: 1599, explain: "코딩의 모험가" },
    { id: 6, title: "B0", min: 1600, max: 1999, explain: "코딩의 전략가" },
    { id: 7, title: "B+", min: 2000, max: 2499, explain: "코딩의 실전 파이터" },
    { id: 8, title: "A0", min: 2500, max: 2999, explain: "코딩의 실력자" },
    { id: 9, title: "A+", min: 3000, max: Infinity, explain: "코딩의 전설" },
  ];

  // 지금은 안 쓰지만, 나중에 레이팅 연동할 때 쓰라고 남겨둔 함수
  function getRankByRating(rating: number) {
    return Rank.find((r) => rating >= r.min && rating <= r.max);
  }

  const closeTechEditor = () => setIsTechEditorOpen(false);

  const TECH_OPTIONS = [
    "C++",
    "C",
    "C#",
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Unity",
    "Unreal Engine",
    "Python",
    "Java",
    "Spring",
    "Algorithm",
    "DataStructure",
    "OS",
  ];

  const toggleTech = (tech: string) => {
    setSelectedTechs((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const getResultBadgeClass = (result: string) => {
    const upper = result.toUpperCase();

    if (upper.includes("WIN")) return "bg-success";   // 초록색
    if (upper.includes("LOSE")) return "bg-danger";   // 빨간색

    // 그 밖의 결과 (TOP 3, DRAW 등)는 회색
    return "bg-secondary";
  };

  return (
    <div className={`mypage-root ${theme === "dark" ? "theme-dark" : "theme-light"}`}>

      {/* 상단 랭크 + 프로필 */}
      <section className="rank-hero">
        <div className="rank-hero-overlay" />
        {/* 🔹 오른쪽 위 테마 토글 버튼 */}
        <button className="theme-toggle-btn" onClick={toggleTheme}>
          {theme === "dark" ? "☀ Light Mode" : "🌙 Dark Mode"}
        </button>

        <div className="container-fluid h-100">
          <div className="row h-100 align-items-center">
            {/* 왼쪽: 랭크 정보 */}
            <div className="col-md-5 d-flex flex-column justify-content-center text-md-start text-center rank-left">
              <div className="rank-label mb-2">Game Name</div>
              <div className="rank-up-text mb-3">RANK A0</div>

              <div className="d-flex justify-content-md-start justify-content-center align-items-center gap-3 mb-3">
                <span className="rank-main-letter" />
                <div className="rank-sub-info">
                  <div className="rank-tier-name">코딩의 실력자!</div>
                  <div className="rank-rating">908 pts</div>
                  <div className="rank-percent">정보대 상위 3%</div>
                </div>
              </div>

              <div className="rank-progress-wrap">
                <div className="d-flex justify-content-between small mb-1">
                  <span>다음 티어: A+</span>
                  <span>-42 pts</span>
                </div>
                <div className="progress rank-progress">
                  <div className="progress-bar" style={{ width: "80%" }} />
                </div>
              </div>
            </div>

            {/* 오른쪽: 프로필 카드 */}
            <div className="col-md-7 profile-main-info d-flex justify-content-md-end justify-content-center">
              <div className="profile-card text-center text-md-start">
                <div className="d-flex flex-column flex-md-row align-items-center gap-4">
                  {/* 큰 아바타 (배경 이미지로만 사용) */}
                  <div className="d-flex justify-content-md-end justify-content-center">
                    <div className="rank-hero-image" />
                  </div>

                  {/* 닉네임 + 버튼 + 설명 */}
                  <div className="flex-grow-2">
                    <div className="profile-name">{nickname}</div>
                    <div className="profile-title mb-2">정보대 코딩 배틀러</div>

                    <div className="d-flex flex-wrap gap-2 mb-3">
                      <button className="btn btn-sm btn-outline-light">
                        칭호 수정
                      </button>
                      <button
                        className="btn btn-sm btn-outline-light"
                        onClick={() => setIsTechEditorOpen(true)}
                      >
                        기술 스택 수정
                      </button>
                      <button
                        className="btn btn-sm btn-outline-light"
                        onClick={() => {
                          setTempNickname(nickname);
                          setIsNicknameEditorOpen(true);
                        }}
                      >
                        닉네임 변경
                      </button>
                      <button className="btn btn-sm btn-primary">
                        프로필 편집
                      </button>
                    </div>

                    <div className="profile-summary">
                      오늘도 코딩 배틀 중... <br />
                      최근 10판 승률 73% <br />
                      평균 해결 시간 12분.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 아래 정보 카드 영역 */}
      <main className="container-fluid mypage-main py-4">
        <div className="row g-4">
          {/* 기술 스택 카드 */}
          <div className="card mb-3">
            <div className="card-header fw-bold">Tech Stack</div>

            <div className="card-body">
              <p className="small text-muted mb-3">
                상단의 <strong>“기술 스택 수정”</strong> 버튼을 눌러 스택을 수정하세요.
              </p>

              <div className="tech-card-list d-flex flex-wrap gap-4">
                {selectedTechs.length === 0 && (
                  <p className="small text-muted m-0">
                    기술 스택을 선택하면 아래에 카드로 표시됩니다.
                  </p>
                )}

                {selectedTechs.map((tech) => (
                  <div key={tech} className="neon-tech-card">
                    <span className="neon-tech-name">{tech}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>


          {/* 최근 전적 카드 */}
          <div className="card mb-3">
            <div className="card-header fw-bold">최근 전적</div>
            <div className="card-body">
              <table className="table mb-0 table-hover align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>날짜</th>
                    <th>매치</th>
                    <th>결과</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRecords.map((r) => (
                    <tr key={r.id}>
                      <td className="small text-muted">{r.date}</td>
                      <td>{r.title}</td>
                      <td>
                        <span className={`badge ${getResultBadgeClass(r.result)}`}>
                          {r.result}
                        </span>

                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* 기술 스택 수정 모달 */}
      {isTechEditorOpen && (
        <div className="tech-editor-backdrop" onClick={closeTechEditor}>
          <div
            className="tech-editor-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tech-editor-header">
              <h5 className="mb-0">기술 스택 수정</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                aria-label="Close"
                onClick={closeTechEditor}
              />
            </div>

            <div className="tech-editor-body">
              <div className="d-flex flex-wrap gap-2 mb-3">
                {TECH_OPTIONS.map((tech) => {
                  const active = selectedTechs.includes(tech);
                  return (
                    <button
                      key={tech}
                      type="button"
                      className={
                        "btn btn-sm tech-option-btn " +
                        (active ? "tech-option-btn-active" : "")
                      }
                      onClick={() => toggleTech(tech)}
                    >
                      {tech}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="tech-editor-footer d-flex justify-content-end gap-2">
              <button
                className="btn btn-sm btn-primary"
                onClick={closeTechEditor}
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 닉네임 변경 모달 */}
      {isNicknameEditorOpen && (
        <div
          className="tech-editor-backdrop"
          onClick={() => setIsNicknameEditorOpen(false)}
        >
          <div
            className="tech-editor-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tech-editor-header">
              <h5 className="mb-0">닉네임 변경</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setIsNicknameEditorOpen(false)}
              />
            </div>

            <div className="tech-editor-body">
              <p className="small text-muted mb-2">새 닉네임을 입력하세요.</p>

              <input
                type="text"
                className="form-control"
                value={tempNickname}
                onChange={(e) => setTempNickname(e.target.value)}
                placeholder="새 닉네임"
                maxLength={10}
                required
              />
            </div>

            <div className="tech-editor-footer d-flex justify-content-end gap-2">
              <button
                className="btn btn-sm btn-outline-light"
                onClick={() => setIsNicknameEditorOpen(false)}
              >
                취소
              </button>

              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  setNickname(tempNickname);
                  setIsNicknameEditorOpen(false);
                }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
