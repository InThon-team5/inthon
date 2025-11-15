import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { BattleIntroOverlay } from "../components/BattleIntroOverlay";
import "./BattlePage.css";

const BATTLE_DURATION = 180; // 3분
const TOTAL_QUESTIONS = 5;

type BattleStage = "waiting" | "intro" | "playing" | "finished";

type ChatMessage = {
  id: number;
  sender: "me" | "opponent";
  text: string;
};

export default function BattlePage() {
  const { matchId } = useParams();
  const myNickname = "Jiwan"; // TODO: auth 연동
  const enemyNickname = "S.Duck"; // TODO: 매칭 정보 연동

  const [stage, setStage] = useState<BattleStage>("waiting");
  const [secondsLeft, setSecondsLeft] = useState(BATTLE_DURATION);

  const [answer, setAnswer] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, sender: "opponent", text: "GLHF 👋" },
  ]);

  // 상대 진행 상황 (나중에 소켓/서버 이벤트로 교체)
  const [opponentSolved, setOpponentSolved] = useState(0);
  const [opponentStatusMessage, setOpponentStatusMessage] = useState(
    "상대가 아직 문제를 풀고 있습니다."
  );

  // 라이트/다크 모드
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 모달
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // DEV: 입장 후 1.2초 뒤 intro 로 전환
  useEffect(() => {
    if (stage !== "waiting") return;
    const id = setTimeout(() => setStage("intro"), 1200);
    return () => clearTimeout(id);
  }, [stage]);

  // playing 시작 시 타이머 리셋
  useEffect(() => {
    if (stage === "playing") {
      setSecondsLeft(BATTLE_DURATION);
    }
  }, [stage]);

  // 타이머 감소
  useEffect(() => {
    if (stage !== "playing") return;
    if (secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, secondsLeft]);

  // 00:00 → 무승부 모달
  useEffect(() => {
    if (stage === "playing" && secondsLeft === 0) {
      setStage("finished");
      setShowTimeUpModal(true);
      // TODO: 서버에 무승부 결과 전송
    }
  }, [secondsLeft, stage]);

  const formattedTime = () => {
    const m = Math.floor(secondsLeft / 60)
      .toString()
      .padStart(2, "0");
    const s = (secondsLeft % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleSubmitAnswer = () => {
    if (!answer.trim()) return;
    console.log("제출된 답안:", answer);
    // TODO: 서버 제출 + 상대 진행 상황 업데이트
    alert("답안을 제출했습니다! (나중에 API 연동 예정)");
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, sender: "me", text: chatInput.trim() },
    ]);
    setChatInput("");
  };

  const handleClickExit = () => {
    setShowExitModal(true);
  };

  const handleConfirmExit = () => {
    setShowExitModal(false);
    // TODO: 실제 나가기 로직 (라우팅 / 결과 처리)
    window.history.back();
  };

  const isPlaying = stage === "playing";

  const opponentProgressPercent =
    (opponentSolved / TOTAL_QUESTIONS) * 100;

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

      {/* 메인 헤더 */}
      <header className="loop-header">
        <div className="loop-match-info">
          <div className="loop-match-label">
            Battle #{matchId ?? "1"}
          </div>
          <div className="loop-vs-row">
            <span className="loop-player-me">{myNickname}</span>
            <span className="loop-vs">vs</span>
            <span className="loop-player-enemy">{enemyNickname}</span>
          </div>
          <div className="loop-category-text">
            카테고리: OS / 자료구조 / 알고리즘
          </div>
        </div>

        <div className="loop-header-right">
          <div className="loop-timer">
            <div className="loop-timer-label">남은 시간</div>
            <div className="loop-timer-value">{formattedTime()}</div>
          </div>
          <button
            className="loop-exit-btn"
            type="button"
            onClick={handleClickExit}
          >
            나가기
          </button>
        </div>
      </header>

      {/* 상대 대기 배너 */}
      {stage === "waiting" && (
        <div className="loop-wait-banner">
          상대를 기다리는 중입니다...
        </div>
      )}

      {/* 메인 영역 */}
      <main className="loop-main">
        {/* 왼쪽: 문제 카드 */}
        <section className="loop-left">
          <div className="loop-question-card">
            {/* 상단 태그 */}
            <div className="loop-question-top">
              <div className="loop-question-tags">
                <span className="loop-q-badge">Q1</span>
                <div className="loop-tag-list">
                  <span className="loop-tag-chip">OS 기본</span>
                  <span className="loop-tag-chip">단답형</span>
                </div>
              </div>
            </div>

            {/* 현재 문제 정보 */}
            <div className="loop-current-meta">
              <span className="loop-current-pill">현재 문제</span>
              <span className="loop-current-index">
                <span className="loop-current-index-strong">1 / 5</span>  
              </span>
            </div>

            {/* 문제 텍스트 */}
            <div className="loop-question-body">
              <p className="loop-question-title">
                [예시 문제] 프로세스와 스레드의 차이를 간단히 설명하고,
                멀티스레딩의 장점 2가지를 서술하시오.
              </p>
              <p className="loop-question-subtext">
                실제 구현에서는 서버에서 받은 요청 테스트를 이 영역에
                렌더링하면 됩니다. 긴 문제도 스크롤 되도록 처리되어
                있습니다.
              </p>
            </div>

            {/* 답안 입력 */}
            <div className="loop-answer-section">
              <div className="loop-answer-header">
                <div className="loop-answer-title-wrap">
                  <div className="loop-answer-bar" />
                  <span className="loop-answer-title">답안 작성</span>
                </div>
                <span className="loop-answer-tip">
                  여기서 바로 답안을 작성하면 유리합니다 🔥
                </span>
              </div>

              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={!isPlaying}
                className="loop-answer-textarea"
                placeholder={
                  isPlaying
                    ? "여기에 답안을 작성하세요. (코드, 단답, 서술형 등)"
                    : "배틀 시작 후 답안을 작성할 수 있습니다."
                }
              />

              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={!isPlaying || !answer.trim()}
                className="loop-primary-btn loop-answer-submit"
              >
                정답 제출
              </button>
            </div>
          </div>
        </section>

        {/* 오른쪽: 상대 진행 상황 + 채팅 */}
        <section className="loop-right">
          {/* 상대 진행 카드 */}
          <div className="loop-opponent-card">
            <div className="loop-opponent-header">
              <span className="loop-subtitle">상대 진행 상황</span>
              <span className="loop-opponent-name">{enemyNickname}</span>
            </div>

            <div className="loop-progress-row">
              <div className="loop-progress-bar">
                <div
                  className="loop-progress-fill"
                  style={{ width: `${opponentProgressPercent}%` }}
                />
              </div>
              <span className="loop-progress-text">
                {opponentSolved} / {TOTAL_QUESTIONS}
              </span>
            </div>

            <p className="loop-opponent-message">
              {opponentStatusMessage}
            </p>
          </div>

          {/* 채팅 카드 */}
          <div className="loop-chat-card">
            <div className="loop-chat-header">
              <h3 className="loop-subtitle">실시간 채팅</h3>
              <span className="loop-chat-hint">
                매너 채팅 부탁드립니다 🙏
              </span>
            </div>

            <div className="loop-chat-body">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={
                    m.sender === "me"
                      ? "loop-chat-row loop-chat-row-me"
                      : "loop-chat-row"
                  }
                >
                  <div
                    className={
                      m.sender === "me"
                        ? "loop-chat-bubble loop-chat-bubble-me"
                        : "loop-chat-bubble"
                    }
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="loop-chat-input-row">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
                disabled={!isPlaying}
                className="loop-chat-input"
                placeholder={
                  isPlaying
                    ? "메시지 입력 후 Enter"
                    : "배틀 시작 후 채팅을 보낼 수 있습니다."
                }
              />
              <button
                type="button"
                onClick={handleSendChat}
                disabled={!isPlaying || !chatInput.trim()}
                className="loop-chat-send-btn"
              >
                전송
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 상대 입장 연출 */}
      {stage === "intro" && (
        <BattleIntroOverlay
          myNickname={myNickname}
          enemyNickname={enemyNickname}
          onDone={() => setStage("playing")}
        />
      )}

      {/* 무승부 모달 */}
      {showTimeUpModal && (
        <div className="loop-modal-backdrop">
          <div className="loop-modal">
            <h2 className="loop-modal-title">무승부!</h2>
            <p className="loop-modal-text">
              남은 시간이 <strong>00:00</strong>이 되어 배틀이
              무승부로 종료되었습니다.
            </p>
            <button
              type="button"
              className="loop-primary-btn loop-modal-single-btn"
              onClick={() => setShowTimeUpModal(false)}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 나가기 확인 모달 */}
      {showExitModal && (
        <div className="loop-modal-backdrop">
          <div className="loop-modal">
            <h2 className="loop-modal-title">배틀에서 나가시겠습니까?</h2>
            <p className="loop-modal-text">
              지금 나가면 <strong>패배</strong>로 기록됩니다. 정말
              나가시겠어요?
            </p>
            <div className="loop-modal-actions">
              <button
                type="button"
                className="loop-secondary-btn"
                onClick={() => setShowExitModal(false)}
              >
                계속 싸우기
              </button>
              <button
                type="button"
                className="loop-danger-btn"
                onClick={handleConfirmExit}
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
