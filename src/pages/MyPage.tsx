import "bootstrap/dist/css/bootstrap.min.css";
import "./Mypage.css";
import { useState, useEffect } from "react";
import {
  fetchProfile,
  fetchTechStacks,
  fetchTitles,
  fetchClubs,
  updateProfile,
  type TechStackRef,
  type TitleRef,
  type ClubRef,
  type Profile,
} from "./services/profileApi";
import { useNavigate } from "react-router-dom";

export default function MyPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const navigate = useNavigate();

  // 데모용 최근 전적 (나중에 API 붙이면 교체)
  const recentRecords = [
    { id: 1, title: "코딩 배틀 vs 홍길동", date: "2025-11-10", result: "WIN" },
    { id: 2, title: "나 vs 너", date: "2025-11-09", result: "LOSE" },
  ];

  // ===== API 상태 =====
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 기술 스택
  const [techOptions, setTechOptions] = useState<TechStackRef[]>([]);
  const [selectedTechIds, setSelectedTechIds] = useState<number[]>([]);
  const [isTechEditorOpen, setIsTechEditorOpen] = useState(false);

  // 닉네임
  const [nickname, setNickname] = useState("NickName");
  const [tempNickname, setTempNickname] = useState("NickName");
  const [isNicknameEditorOpen, setIsNicknameEditorOpen] = useState(false);

  // 소속(동아리)
  const [clubOptions, setClubOptions] = useState<ClubRef[]>([]);
  const [selectedClubIds, setSelectedClubIds] = useState<number[]>([]);
  const [isClubEditorOpen, setIsClubEditorOpen] = useState(false);

  // 칭호
  const [titleOptions, setTitleOptions] = useState<TitleRef[]>([]);
  const [selectedTitleId, setSelectedTitleId] = useState<number | null>(null);
  const [isTitleEditorOpen, setIsTitleEditorOpen] = useState(false);

  // ===== 티어 정보 (멘트 포함) =====
  const Rank = [
    { id: 1, title: "F", min: 0, max: 399, explain: "코딩의 재앙", percent: "정보대 하위 1%" },
    { id: 2, title: "D0", min: 400, max: 699, explain: "코딩의 순수 입문자", percent: "정보대 하위 10%" },
    { id: 3, title: "D+", min: 700, max: 999, explain: "while(true) { 노력 중; }", percent: "정보대 하위 25%" },
    { id: 4, title: "C0", min: 1000, max: 1299, explain: "코딩의 새싹 개발자", percent: "정보대 상위 50%" },
    { id: 5, title: "C+", min: 1300, max: 1599, explain: "코딩의 모험가", percent: "정보대 상위 15%" },
    { id: 6, title: "B0", min: 1600, max: 1999, explain: "코딩의 전략가", percent: "정보대 상위 5%" },
    { id: 7, title: "B+", min: 2000, max: 2499, explain: "코딩의 실전 파이터", percent: "정보대 상위 2%" },
    { id: 8, title: "A0", min: 2500, max: 2999, explain: "코딩의 실력자", percent: "정보대 상위 1%" },
    { id: 9, title: "A+", min: 3000, max: Infinity, explain: "코딩의 전설", percent: "정보대 최상위 0.1%" },
  ];

  function getRankByRating(rating: number) {
    return Rank.find((r) => rating >= r.min && rating <= r.max);
  }

  const closeTechEditor = () => setIsTechEditorOpen(false);

  const toggleTech = (id: number) => {
    setSelectedTechIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const toggleClub = (id: number) => {
    setSelectedClubIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSelectTitle = (id: number | null) => {
    setSelectedTitleId(id);
  };

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const getResultBadgeClass = (result: string) => {
    const upper = result.toUpperCase();

    if (upper.includes("WIN")) return "bg-success";
    if (upper.includes("LOSE")) return "bg-danger";
    return "bg-secondary";
  };

  // ===== 현재 레이팅/티어/진행도 계산 =====
  const currentRating = profile?.rating ?? 0;
  const currentRank = getRankByRating(currentRating) ?? Rank[7]; // 기본 A0

  const currentRankIndex = Rank.findIndex((r) => r.id === currentRank.id);
  const nextRank =
    currentRankIndex >= 0 && currentRankIndex < Rank.length - 1
      ? Rank[currentRankIndex + 1]
      : null;

  let progressPercent = 100;
  let nextTierLabel = "최고 티어입니다";
  let nextTierRemainLabel = "";

  if (nextRank) {
    const rangeSize = nextRank.min - currentRank.min;
    const filled = currentRating - currentRank.min;
    progressPercent = Math.min(100, Math.max(0, (filled / rangeSize) * 100));

    const remain = Math.max(nextRank.min - currentRating, 0);
    nextTierLabel = nextRank.title;
    nextTierRemainLabel = `-${remain} pts`;
  }

  // 칭호 선택 옵션 (나중에 소속별 제한 생기면 여기서 필터링)
  const selectableTitles =
    profile && profile.titles && profile.titles.length > 0
      ? profile.titles
      : titleOptions;

  // ===== 마운트 시 프로필/참조 데이터 불러오기 =====
  useEffect(() => {
    const access = localStorage.getItem("loop_access");

    if (!access) {
      setError("로그인이 필요합니다. 메인 페이지에서 다시 로그인 해주세요.");
      setIsLoading(false);
      return;
    }

    async function load() {
      try {
        setIsLoading(true);
        const [profileRes, techList, titleList, clubList] = await Promise.all([
          fetchProfile(access!),
          fetchTechStacks(),
          fetchTitles(),
          fetchClubs(),
        ]);

        setProfile(profileRes);

        const nick = profileRes.nickname || "NickName";
        setNickname(nick);
        setTempNickname(nick);

        setTechOptions(techList);
        setTitleOptions(titleList);
        setClubOptions(clubList);

        const techIdsFromProfile =
          profileRes.tech_stacks?.map((t) => t.id) ?? [];
        setSelectedTechIds(techIdsFromProfile);

        const clubIdsFromProfile = profileRes.clubs?.map((c) => c.id) ?? [];
        setSelectedClubIds(clubIdsFromProfile);

        setSelectedTitleId(profileRes.activate_title?.id ?? null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "프로필 정보를 불러오는 중 오류가 발생했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  // ===== 기술 스택 저장 (PATCH /api/profile/) =====
  const handleSaveTechStacks = async () => {
    const access = localStorage.getItem("loop_access");
    if (!access) {
      setError("로그인 정보가 없습니다. 다시 로그인 해주세요.");
      closeTechEditor();
      return;
    }

    try {
      await updateProfile(access, { tech_stack_ids: selectedTechIds });

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              tech_stacks: techOptions.filter((t) =>
                selectedTechIds.includes(t.id)
              ),
            }
          : prev
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "기술 스택을 저장하는 중 오류가 발생했습니다."
      );
    } finally {
      closeTechEditor();
    }
  };

  // ===== 소속(동아리) 저장 =====
  const handleSaveClubs = async () => {
    const access = localStorage.getItem("loop_access");
    if (!access) {
      setError("로그인 정보가 없습니다. 다시 로그인 해주세요.");
      setIsClubEditorOpen(false);
      return;
    }

    try {
      // 1) 서버에는 id 배열만 보냄
      await updateProfile(access, { club_ids: selectedClubIds });

      // 2) 응답에 clubs가 있든 없든,
      //    프론트에서 현재 선택 상태로 profile.clubs를 직접 맞춰준다.
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              clubs: clubOptions.filter((c) =>
                selectedClubIds.includes(c.id)
              ),
            }
          : prev
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "소속을 저장하는 중 오류가 발생했습니다."
      );
    } finally {
      setIsClubEditorOpen(false);
    }
  };


  // ===== 칭호 저장 (활성 칭호) =====
  const handleSaveActiveTitle = async () => {
    const access = localStorage.getItem("loop_access");
    if (!access) {
      setError("로그인 정보가 없습니다. 다시 로그인 해주세요.");
      setIsTitleEditorOpen(false);
      return;
    }

    try {
      const updated = await updateProfile(access, {
        activate_title: selectedTitleId,
      });
      setProfile(updated);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "칭호를 저장하는 중 오류가 발생했습니다."
      );
    } finally {
      setIsTitleEditorOpen(false);
    }
  };

  return (
    <div
      className={`mypage-root ${
        theme === "dark" ? "theme-dark" : "theme-light"
      }`}
    >
      {/* 전역 에러 표시 */}
      {error && (
        <div className="alert alert-danger text-center m-0 rounded-0">
          {error}
        </div>
      )}

      {/* 상단 랭크 + 프로필 */}
      <section className="rank-hero">
        <div className="rank-hero-overlay" />
        <button className="theme-toggle-btn" onClick={toggleTheme}>
          {theme === "dark" ? "☀ Light Mode" : "🌙 Dark Mode"}
        </button>

        <div className="container-fluid h-100">
          <div className="row h-100 align-items-center">
            {/* 왼쪽: 랭크 정보 */}
            <div className="col-md-5 d-flex flex-column justify-content-center text-md-start text-center rank-left">
              <div className="rank-label mb-2">Loop</div>
              <div className="rank-up-text mb-3">
                RANK {currentRank.title}
              </div>

              <div className="d-flex justify-content-md-start justify-content-center align-items-center gap-3 mb-3">
                <span className="rank-main-letter" />
                <div className="rank-sub-info">
                  <div className="rank-tier-name">{currentRank.explain}</div>
                  <div className="rank-rating">
                    {currentRating.toLocaleString()} pts
                  </div>
                  <div className="rank-percent">{currentRank.percent}</div>
                </div>
              </div>

              <div className="rank-progress-wrap">
                <div className="d-flex justify-content-between small mb-1">
                  <span>
                    다음 티어: {nextRank ? nextTierLabel : "MAX"}
                  </span>
                  <span>{nextRank ? nextTierRemainLabel : ""}</span>
                </div>
                <div className="progress rank-progress">
                  <div
                    className="progress-bar"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 오른쪽: 프로필 카드 */}
            <div className="col-md-7 profile-main-info d-flex justify-content-md-end justify-content-center">
              <div className="profile-card text-center text-md-start">
                <div className="d-flex flex-column flex-md-row align-items-center gap-4">
                  <div className="d-flex justify-content-md-end justify-content-center">
                    <div className="rank-hero-image" />
                  </div>

                  <div className="flex-grow-2">
                    <div className="profile-name">
                      {nickname}
                      {isLoading && (
                        <span className="ms-2 small text-muted">
                          불러오는 중...
                        </span>
                      )}
                    </div>
                    <div className="profile-title mb-2">
                      {profile?.activate_title? profile.activate_title.name : "칭호 없음"}
                    </div>

                    <div className="d-flex flex-wrap gap-2 mb-3">
                      <button
                        className="btn btn-sm btn-outline-light"
                        onClick={() => { setIsTitleEditorOpen(true)}}
                      >
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
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => setIsClubEditorOpen(true)}
                      >
                        소속 수정
                      </button>
                    </div>

                    <div className="profile-summary">
                      오늘도 코딩 배틀 중... <br />
                      최근 10판 승률 73% <br />
                      평균 해결 시간 12분. <br />
                      {profile?.clubs && profile.clubs.length > 0 ? (
                        <span className="small text-muted">
                          소속:{" "}
                          {profile.clubs.map((c) => c.name).join(", ")}
                        </span>
                      ) : (
                        <span className="small text-muted">
                          소속이 아직 설정되지 않았습니다.
                        </span>
                      )}
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
                상단의 <strong>“기술 스택 수정”</strong> 버튼을 눌러 스택을
                수정하세요.
              </p>

              <div className="tech-card-list d-flex flex-wrap gap-4">
                {selectedTechIds.length === 0 && (
                  <p className="small text-muted m-0">
                    기술 스택을 선택하면 아래에 카드로 표시됩니다.
                  </p>
                )}

                {selectedTechIds.map((id) => {
                  const tech = techOptions.find((t) => t.id === id);
                  if (!tech) return null;
                  return (
                    <div key={id} className="neon-tech-card">
                      <span className="neon-tech-name">{tech.name}</span>
                    </div>
                  );
                })}
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
                        <span
                          className={`badge ${getResultBadgeClass(r.result)}`}
                        >
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

      {/* ───────── 모달들 ───────── */}

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
                {techOptions.map((tech) => {
                  const active = selectedTechIds.includes(tech.id);
                  return (
                    <button
                      key={tech.id}
                      type="button"
                      className={
                        "btn btn-sm tech-option-btn " +
                        (active ? "tech-option-btn-active" : "")
                      }
                      onClick={() => toggleTech(tech.id)}
                    >
                      {tech.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="tech-editor-footer d-flex justify-content-end gap-2">
              <button
                className="btn btn-sm btn-primary"
                onClick={handleSaveTechStacks}
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 소속 수정 모달 */}
      {isClubEditorOpen && (
        <div
          className="tech-editor-backdrop"
          onClick={() => setIsClubEditorOpen(false)}
        >
          <div
            className="tech-editor-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tech-editor-header">
              <h5 className="mb-0">소속 수정</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                aria-label="Close"
                onClick={() => setIsClubEditorOpen(false)}
              />
            </div>

            <div className="tech-editor-body">
              <p className="small text-muted mb-2">
                동아리를 선택하면 마이페이지와 배틀에서 표시됩니다.
              </p>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {clubOptions.map((club) => {
                  const active = selectedClubIds.includes(club.id);
                  return (
                    <button
                      key={club.id}
                      type="button"
                      className={
                        "btn btn-sm tech-option-btn " +
                        (active ? "tech-option-btn-active" : "")
                      }
                      onClick={() => toggleClub(club.id)}
                    >
                      {club.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="tech-editor-footer d-flex justify-content-end gap-2">
              <button
                className="btn btn-sm btn-primary"
                onClick={handleSaveClubs}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 칭호 수정 모달 */}
      {isTitleEditorOpen && (
        <div
          className="tech-editor-backdrop"
          onClick={() => setIsTitleEditorOpen(false)}
        >
          <div
            className="tech-editor-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tech-editor-header">
              <h5 className="mb-0">칭호 수정</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                aria-label="Close"
                onClick={() => { setIsTitleEditorOpen(false);}}
              />
            </div>

            <div className="tech-editor-body">
              <p className="small text-muted mb-2">
                사용할 칭호를 선택하세요. (소속 규칙은 나중에 여기에 반영)
              </p>

              <div className="d-flex flex-wrap gap-2 mb-3">
                {selectableTitles.length === 0 ? (
                  <p className="small text-muted m-0">
                    선택할 수 있는 칭호가 없습니다.
                  </p>
                ) : (
                  selectableTitles.map((title) => (
                    <button
                      key={title.id}
                      type="button"
                      className={
                        "btn btn-sm tech-option-btn " +
                        (selectedTitleId === title.id
                          ? "tech-option-btn-active"
                          : "")
                      }
                      onClick={() => handleSelectTitle(title.id)}
                    >
                      {title.name}
                    </button>
                  ))
                )}
              </div>

              <div className="form-check mt-1">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="noTitle"
                  checked={selectedTitleId === null}
                  onChange={(e) => {
                    if (e.target.checked) handleSelectTitle(null);
                  }}
                />
                <label className="form-check-label small" htmlFor="noTitle">
                  칭호 사용 안 함
                </label>
              </div>
            </div>

            <div className="tech-editor-footer d-flex justify-content-end gap-2">
              <button
                className="btn btn-sm btn-primary"
                onClick={async () => { await handleSaveActiveTitle(); window.location.reload();}}
              >
                저장
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
                onClick={async () => {
                  const newNick = tempNickname.trim();
                  if (!newNick) {
                    setIsNicknameEditorOpen(false);
                    return;
                  }

                  const access = localStorage.getItem("loop_access");
                  if (!access) {
                    setError(
                      "로그인 정보가 없습니다. 다시 로그인 해주세요."
                    );
                    setIsNicknameEditorOpen(false);
                    return;
                  }

                  try {
                    const updated = await updateProfile(access, {
                      nickname: newNick,
                    });
                    setProfile(updated);
                    setNickname(updated.nickname);
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : "닉네임을 저장하는 중 오류가 발생했습니다."
                    );
                  } finally {
                    setIsNicknameEditorOpen(false);
                  }
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
