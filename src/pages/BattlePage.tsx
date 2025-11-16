// src/pages/BattlePage.tsx
import { useParams, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { BattleIntroOverlay } from "../components/BattleIntroOverlay";
import "./BattlePage.css";
import { useTheme } from "../ThemeProvider";
const [roomStatus, setRoomStatus] = useState<string | null>(null);

import {
  fetchBattleDetail,
  type BattleQuestionDto,
} from "./services/battleApi";
import {
  submitBattleResult,
  type SubmitResultResponse,
} from "./services/battleRoomApi";

type BattleStage = "waiting" | "intro" | "playing" | "finished";
type QuestionType = "subjective" | "multiple_choice";
type BattleMode = "cote" | "mini";

type ChatMessage = {
  id: number;
  sender: "me" | "opponent";
  text: string;
};

type Question = {
  id: number;
  type: QuestionType;
  title: string;
  description: string;
  subject: string;
  options?: string[];
  correctOptionIndex?: number;
};

type MiniAnswer = {
  questionId: number;
  selectedOption?: number | null;
  text?: string;
};

export default function BattlePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { theme, toggleTheme } = useTheme();

  const numericRoomId = roomId ? Number(roomId) : NaN;


  // 1. 서버에서 받아올 기본 정보들
  const [battleMode, setBattleMode] = useState<BattleMode>("mini");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [initialDuration, setInitialDuration] = useState<number>(10 * 60);
  const [myNickname, setMyNickname] = useState<string>("나");
  const [enemyNickname, setEnemyNickname] = useState<string>("상대");

  const TOTAL_QUESTIONS = questions.length;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 2. 상태들
  const [stage, setStage] = useState<BattleStage>("waiting");
  const [secondsLeft, setSecondsLeft] = useState(initialDuration);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const [miniAnswers, setMiniAnswers] = useState<Record<number, MiniAnswer>>(
    {}
  );
  const [isFinalSubmitted, setIsFinalSubmitted] = useState(false);
  const [showWaitOpponentModal, setShowWaitOpponentModal] = useState(false);

  const [myCorrectCount, setMyCorrectCount] = useState(0);
  const [myFinishTime, setMyFinishTime] = useState<number | null>(null);

  const [battleResult, setBattleResult] = useState<
    "win" | "lose" | "draw" | null
  >(null);

  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, sender: "opponent", text: "GLHF 👋" },
  ]);
  const chatBodyRef = useRef<HTMLDivElement | null>(null);

  const [opponentSolved, setOpponentSolved] = useState(0);
  const [opponentStatusMessage, setOpponentStatusMessage] = useState(
    "상대가 아직 문제를 풀고 있습니다."
  );

  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isPlaying = stage === "playing";
  const canInteract = isPlaying && !isFinalSubmitted;

  const opponentProgressPercent =
    TOTAL_QUESTIONS === 0
      ? 0
      : (opponentSolved / TOTAL_QUESTIONS) * 100;

  useEffect(() => {
    if (!numericRoomId || Number.isNaN(numericRoomId)) return;
    if (roomStatus !== "대기") return; // 대기 상태일 때만 폴링

    const interval = setInterval(async () => {
      try {
        const data = await fetchBattleDetail(numericRoomId);
        setRoomStatus(data.status?.name ?? null);
      } catch (e) {
        console.error("방 상태 폴링 중 오류:", e);
      }
    }, 3000); // 3초마다

    return () => clearInterval(interval);
  }, [numericRoomId, roomStatus]);


  // 3. 배틀 정보 로딩
  useEffect(() => {
    if (!roomId) {
      setLoadError("유효하지 않은 방 ID입니다.");
      setLoading(false);
      return;
    }

    const numericId = Number(roomId);
    if (Number.isNaN(numericId)) {
      setLoadError("유효하지 않은 방 ID입니다.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const data = await fetchBattleDetail(numericId); // ← 방 상세 가져오기

        // 모드: is_cote true면 코테, 아니면 미니
        const mode: BattleMode = data.is_cote ? "cote" : "mini";
        setBattleMode(mode);

        // 시간은 일단 모드별 기본값 (원하면 백엔드에 duration_seconds 추가해도 되고)
        const duration = mode === "cote" ? 40 * 60 : 10 * 60;
        setInitialDuration(duration);
        setSecondsLeft(duration);

        // 닉네임은 일단 대충
        setMyNickname("나");
        setEnemyNickname(data.host.email ?? "상대");

        setRoomStatus(data.status?.name ?? null);

        // 문제 매핑 (description 안의 1.~, 2.~를 option으로 뽑아도 되고, 일단 그대로 둠)
        const mappedQuestions: Question[] = data.problems.map((p) => ({
          id: p.id,
          type: "multiple_choice",      // 우선 객관식으로 고정
          title: p.title,
          description: p.description,
          subject: "공통",              // 나중에 subject 붙이고 싶으면 /api/problems/{id} 써도 됨
          options: p.description
            .split(/\r?\n/)
            .map((line) => line.replace(/^\s*\d+\.\s*/, "").trim())
            .filter((line) => line.length > 0),
        }));


        setQuestions(mappedQuestions);
        setCurrentIndex(0);
        setMiniAnswers({});
        setIsFinalSubmitted(false);
        setStage("waiting");
      } catch (e) {
        console.error(e);
        setLoadError(
          e instanceof Error
            ? e.message
            : "배틀 정보를 불러오는 데 실패했습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [roomId]);


  // 4. 유틸

  const formattedTime = () => {
    const m = Math.floor(secondsLeft / 60)
      .toString()
      .padStart(2, "0");
    const s = (secondsLeft % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // 현재 문제 입력값 로딩
  useEffect(() => {
    if (!currentQuestion) return;
    const saved = miniAnswers[currentQuestion.id];
    if (currentQuestion.type === "subjective") {
      setAnswer(saved?.text ?? "");
      setSelectedOption(null);
    } else {
      setSelectedOption(
        saved?.selectedOption !== undefined ? saved.selectedOption : null
      );
      setAnswer("");
    }
  }, [currentQuestion?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 5. 타이머 & 단계 전환

  // waiting → intro (입장 연출)
  useEffect(() => {
    if (stage !== "waiting") return;
    if (loading || loadError || !currentQuestion) return;

    // ✅ 아직 '대기' 상태이면 시작하지 않음
    if (roomStatus !== "진행") return;

    const id = setTimeout(() => setStage("intro"), 1200);
    return () => clearTimeout(id);
  }, [stage, loading, loadError, currentQuestion, roomStatus]);

  // playing 시작 시 타이머 리셋
  useEffect(() => {
    if (stage === "playing") {
      setSecondsLeft(initialDuration);
    }
  }, [stage, initialDuration]);

  // 타이머 tick
  useEffect(() => {
    if (!isPlaying) return;
    if (secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, secondsLeft]);

  // 00:00 처리
  useEffect(() => {
    if (!isPlaying) return;
    if (secondsLeft !== 0) return;

    if (battleMode === "mini") {
      if (!isFinalSubmitted) {
        void handleFinalSubmit(true);
      }
    } else {
      setStage("finished");
      setShowTimeUpModal(true);
    }
  }, [secondsLeft, isPlaying, battleMode, isFinalSubmitted]);

  // 채팅 auto-scroll
  useEffect(() => {
    if (!chatBodyRef.current) return;
    const el = chatBodyRef.current;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  // 6. 핸들러들

  const saveCurrentAnswerToState = () => {
    if (battleMode !== "mini") return;
    if (!currentQuestion) return;

    setMiniAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        selectedOption:
          currentQuestion.type === "multiple_choice"
            ? selectedOption
            : undefined,
        text:
          currentQuestion.type === "subjective" ? answer.trim() : undefined,
      },
    }));
  };

  const handleSubmitAnswer = () => {
    if (!canInteract || !currentQuestion) return;

    if (currentQuestion.type === "subjective") {
      if (!answer.trim()) return;
    } else {
      if (selectedOption === null) return;
    }

    saveCurrentAnswerToState();

    if (battleMode === "cote") {
      alert("코테 답안을 제출했습니다! (나중에 API 연동 예정)");
      setStage("finished");
      setBattleResult("draw");
      return;
    }

    const isLast = currentIndex === TOTAL_QUESTIONS - 1;

    if (!isLast) {
      setCurrentIndex((prev) => Math.min(prev + 1, TOTAL_QUESTIONS - 1));
    } else {
      void handleFinalSubmit(false);
    }
  };

  // 미니 최종 제출
  const handleFinalSubmit = async (fromTimeUp: boolean) => {
    if (isFinalSubmitted) return;

    // 마지막 문제 답도 반영
    saveCurrentAnswerToState();

    const elapsed = initialDuration - secondsLeft;
    setMyFinishTime(elapsed);

    let correct = 0;
    for (const q of questions) {
      const ans = miniAnswers[q.id];
      if (!ans) continue;
      if (
        q.type === "multiple_choice" &&
        q.correctOptionIndex !== undefined &&
        ans.selectedOption === q.correctOptionIndex
      ) {
        correct++;
      }
    }
    setMyCorrectCount(correct);

    setIsFinalSubmitted(true);
    setStage("finished");

    const accuracyPercent =
      TOTAL_QUESTIONS === 0
        ? 0
        : Math.round((correct / TOTAL_QUESTIONS) * 100);
    const remainingPercent =
      initialDuration === 0
        ? 0
        : Math.round((secondsLeft / initialDuration) * 100);

    if (!numericRoomId || Number.isNaN(numericRoomId)) {
      console.warn("roomId 없음, 서버에 결과를 보낼 수 없습니다.");
      setShowWaitOpponentModal(true);
      return;
    }

    try {
      const res = await submitBattleResult(numericRoomId, {
        remaining_time_percent: remainingPercent,
        accuracy_percent: accuracyPercent,
      });

      console.log("submit-result 응답:", res);

      if (res.is_complete) {
        const finalResult =
          (res.my_result_status as "win" | "lose" | "draw" | undefined) ??
          (res.my_result.result as "win" | "lose" | "draw");
        handleServerResult(finalResult);
      } else {
        setShowWaitOpponentModal(true);
      }
    } catch (e) {
      console.error(e);
      alert(
        e instanceof Error
          ? e.message
          : "결과 전송 중 오류가 발생했습니다."
      );
    }
  };

  const handleServerResult = (result: "win" | "lose" | "draw") => {
    setBattleResult(result);
    setShowWaitOpponentModal(false);
    setShowTimeUpModal(false);
  };

  const handleSendChat = () => {
    if (!chatInput.trim() || !isPlaying) return;
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
    window.history.back();
  };

  // 7. 로딩/에러 처리

  if (loading) {
    return (
      <div className={`loop-root ${theme === "dark" ? "dark-mode" : ""}`}>
        <div className="loop-loading-center">배틀 정보를 불러오는 중...</div>
      </div>
    );
  }

  if (loadError || !currentQuestion) {
    return (
      <div className={`loop-root ${theme === "dark" ? "dark-mode" : ""}`}>
        <div className="loop-loading-center">
          {loadError ?? "배틀 정보를 찾을 수 없습니다."}
        </div>
      </div>
    );
  }

  // 8. 렌더링

  return (
    <div className={`loop-root ${theme === "dark" ? "dark-mode" : ""}`}>
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
            onClick={toggleTheme}
          >
            <span className="loop-theme-dot" />
            <span className="loop-theme-label">
              {theme === "dark" ? "Dark Mode" : "Light Mode"}
            </span>
          </button>
          <span className="loop-version">
            {battleMode === "cote" ? "코테 모드" : "미니 모드"} · v0.1
          </span>
        </div>
      </div>

      {/* 헤더 */}
      <header className="loop-header">
        <div className="loop-match-info">
          <div className="loop-match-label">
            Battle #{roomId ?? "?"} ·{" "}
            {battleMode === "cote" ? "코딩 테스트" : "미니 퀴즈"}
          </div>
          <div className="loop-vs-row">
            <span className="loop-player-me">{myNickname}</span>
            <span className="loop-vs">vs</span>
            <span className="loop-player-enemy">{enemyNickname}</span>
          </div>
          <div className="loop-category-text">
            카테고리: {currentQuestion.subject}
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

      {/* 메인 */}
      <main className="loop-main">
        {/* 왼쪽: 문제 카드 */}
        <section className="loop-left">
          <div className="loop-question-card">
            <div className="loop-question-top">
              <div className="loop-question-tags">
                <span className="loop-q-badge">
                  Q{currentQuestion.id}
                </span>
                <div className="loop-tag-list">
                  <span className="loop-tag-chip">
                    {currentQuestion.subject}
                  </span>
                  <span className="loop-tag-chip">
                    {currentQuestion.type === "multiple_choice"
                      ? "객관식"
                      : "주관식"}
                  </span>
                </div>
              </div>
            </div>

            <div className="loop-current-meta">
              <span className="loop-current-pill">현재 문제</span>
              <span className="loop-current-index">
                <span className="loop-current-index-strong">
                  {currentIndex + 1} / {TOTAL_QUESTIONS}
                </span>
              </span>
            </div>

            <div className="loop-question-body">
              <p className="loop-question-title">
                {currentQuestion.title}
              </p>
              <p className="loop-question-subtext">
                {currentQuestion.description}
              </p>
            </div>

            <div className="loop-answer-section">
              <div className="loop-answer-header">
                <div className="loop-answer-title-wrap">
                  <div className="loop-answer-bar" />
                  <span className="loop-answer-title">
                    {currentQuestion.type === "multiple_choice"
                      ? "정답 선택"
                      : "답안 작성"}
                  </span>
                </div>
                <span className="loop-answer-tip">
                  {battleMode === "mini"
                    ? "여러 문제 중 더 많이 맞추고, 동점이면 더 빨리 푼 사람이 승리합니다 🔥"
                    : "테스트케이스를 더 많이 통과한 사람이 승리합니다 🔥"}
                </span>
              </div>

              {currentQuestion.type === "subjective" ? (
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={!canInteract}
                  className="loop-answer-textarea"
                  placeholder={
                    canInteract
                      ? "여기에 답안을 작성하세요. (코드, 단답, 서술형 등)"
                      : "제출 이후에는 답안을 수정할 수 없습니다."
                  }
                />
              ) : (
                <div className="loop-option-grid">
                  {currentQuestion.options?.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={!canInteract}
                      className={
                        "loop-option-btn" +
                        (selectedOption === idx
                          ? " loop-option-btn-selected"
                          : "")
                      }
                      onClick={() => setSelectedOption(idx)}
                    >
                      <span className="loop-option-prefix">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <span className="loop-option-text">{opt}</span>
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={
                  !canInteract ||
                  (currentQuestion.type === "subjective"
                    ? !answer.trim()
                    : selectedOption === null)
                }
                className="loop-primary-btn loop-answer-submit"
              >
                {battleMode === "mini"
                  ? currentIndex === TOTAL_QUESTIONS - 1
                    ? "마지막 문제 제출 & 최종 제출"
                    : "정답 제출 후 다음 문제"
                  : "정답 제출"}
              </button>

              {battleMode === "mini" && (
                <div
                  style={{
                    marginTop: "0.6rem",
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.8rem",
                  }}
                >
                  <button
                    type="button"
                    disabled={!canInteract || currentIndex === 0}
                    onClick={() =>
                      setCurrentIndex((prev) => Math.max(prev - 1, 0))
                    }
                    className="loop-secondary-btn"
                  >
                    이전 문제
                  </button>
                  <span style={{ color: "#6b7280" }}>
                    최종 제출 후에는 답안을 고칠 수 없습니다.
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 오른쪽: 상대 진행 + 채팅 */}
        <section className="loop-right">
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

          <div className="loop-chat-card">
            <div className="loop-chat-header">
              <h3 className="loop-subtitle">실시간 채팅</h3>
              <span className="loop-chat-hint">
                매너 채팅 부탁드립니다 🙏
              </span>
            </div>

            <div className="loop-chat-body" ref={chatBodyRef}>
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

      {/* 시간 종료 모달 (코테용) */}
      {showTimeUpModal && (
        <div className="loop-modal-backdrop">
          <div className="loop-modal">
            <h2 className="loop-modal-title">시간 종료!</h2>
            <p className="loop-modal-text">
              남은 시간이 <strong>00:00</strong>이 되어 배틀이
              종료되었습니다. (추후 서버 판정에 따라 승/패가 결정됩니다.)
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

      {/* 미니: 상대 기다리는 모달 */}
      {showWaitOpponentModal && (
        <div className="loop-modal-backdrop">
          <div className="loop-modal">
            <h2 className="loop-modal-title">최종 제출 완료! 🔔</h2>
            <p className="loop-modal-text">
              모든 문제의 답안을 제출했습니다. <br />
              이제 <strong>상대방이 모든 문제를 풀 때까지</strong>{" "}
              기다려 주세요.
            </p>
            <p className="loop-modal-text">
              내 정답 개수: <strong>{myCorrectCount}</strong> /{" "}
              {TOTAL_QUESTIONS}
              <br />
              사용한 시간:{" "}
              <strong>
                {Math.floor((myFinishTime ?? 0) / 60)}분{" "}
                {(myFinishTime ?? 0) % 60}초
              </strong>
            </p>
          </div>
        </div>
      )}

      {/* 승/패 결과 모달 */}
      {battleResult && (
        <div className="loop-modal-backdrop">
          <div className="loop-modal">
            <h2 className="loop-modal-title">
              {battleResult === "win"
                ? "승리! 🏆"
                : battleResult === "lose"
                  ? "패배… 😢"
                  : "무승부 🤝"}
            </h2>
            <p className="loop-modal-text">
              {battleMode === "cote"
                ? "테스트케이스 통과 수와 정확도를 기준으로 승패가 결정되었습니다."
                : "정답 개수와 풀이 시간을 기준으로 승패가 결정되었습니다."}
            </p>
            <button
              type="button"
              className="loop-primary-btn loop-modal-single-btn"
              onClick={() => setBattleResult(null)}
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
              지금 나가면 <strong>패배</strong>로 기록될 수 있습니다.
              정말 나가시겠어요?
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
