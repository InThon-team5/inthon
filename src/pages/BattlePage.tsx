import { useParams } from "react-router-dom";
import { useEffect, useState, useRef, useMemo } from "react";
import { BattleIntroOverlay } from "../components/BattleIntroOverlay";
import "./BattlePage.css";
import { useTheme } from "../ThemeProvider";

type BattleStage = "waiting" | "intro" | "playing" | "finished";
type QuestionType = "subjective" | "multiple_choice";

// ✅ 배틀 모드 (코테 / 미니)
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
  // 미니 모드에서만 사용하는 예시 정답 (추후 서버에서 받을 예정)
  correctOptionIndex?: number;
};

type MiniAnswer = {
  questionId: number;
  // 객관식이면 selectedOption 사용, 주관식이면 text 사용
  selectedOption?: number | null;
  text?: string;
};

export default function BattlePage() {
  const { matchId } = useParams();
  const myNickname = "Jiwan";
  const enemyNickname = "S.Duck";

  // =========================
  // 1. 배틀 모드 / 문제 세팅
  // =========================

  // ⭐ 지금은 임시로 미니/코테를 정해두고,
  //   나중에 API나 라우터 state로 교체하면 됨.
  const [battleMode] = useState<BattleMode>("mini"); // "cote"로 바꾸면 코테 모드

  // 모드에 따라 제한 시간/문제 수 결정
  const initialDuration = useMemo(
    () => (battleMode === "cote" ? 40 * 60 : 10 * 60),
    [battleMode]
  );

  // 예시 문제들 (나중에 전부 서버에서 받아서 교체)
  const coteQuestion: Question = {
    id: 1,
    type: "multiple_choice",
    title:
      "[코테] 프로세스와 스레드의 차이를 간단히 설명하고, 멀티스레딩의 장점 2가지를 서술하시오.",
    description:
      "실제 구현에서는 서버에서 받은 코딩 테스트 문제/설명/입출력 예시 등을 이 영역에 렌더링하면 됩니다.",
    subject: "OS",
    options: [
      "프로세스는 독립된 메모리 공간을 가지지만 스레드는 같은 프로세스의 메모리를 공유한다.",
      "스레드는 항상 단일 코어에서만 실행된다.",
      "멀티스레딩은 I/O 대기 시간을 활용해 CPU 활용도를 높일 수 있다.",
      "멀티스레딩은 항상 성능 저하를 유발한다.",
    ],
    correctOptionIndex: 0, // 예시
  };

  const miniQuestions: Question[] = [
    {
      id: 1,
      type: "multiple_choice",
      title: "[Q1] 프로세스와 스레드의 차이에 대한 설명으로 옳은 것은?",
      description: "OS 기본 개념 문제입니다.",
      subject: "OS",
      options: [
        "프로세스는 독립적인 메모리 공간을 갖고, 스레드는 이를 공유한다.",
        "프로세스와 스레드는 항상 같은 메모리 공간을 공유한다.",
        "스레드는 항상 한 개의 프로세스에만 속하지 않는다.",
        "프로세스는 항상 하나의 스레드만 가진다.",
      ],
      correctOptionIndex: 0,
    },
    {
      id: 2,
      type: "multiple_choice",
      title: "[Q2] 시간 복잡도에 대한 설명으로 옳은 것은?",
      description: "알고리즘 기초 문제입니다.",
      subject: "Algorithm",
      options: [
        "O(N^2)는 O(N log N)보다 항상 빠르다.",
        "빅오 표기법은 최악의 경우를 표현하는 경우가 많다.",
        "O(N)은 항상 O(1)보다 느리다.",
        "빅오 표기법은 공간 복잡도에만 사용된다.",
      ],
      correctOptionIndex: 1,
    },
    {
      id: 3,
      type: "multiple_choice",
      title: "[Q3] 스택 자료구조의 특성은?",
      description: "자료구조 기본 문제입니다.",
      subject: "Data Structure",
      options: [
        "FIFO, 먼저 들어간 데이터가 먼저 나온다.",
        "LIFO, 나중에 들어간 데이터가 먼저 나온다.",
        "임의 접근이 자유로운 구조이다.",
        "정렬된 상태를 항상 유지한다.",
      ],
      correctOptionIndex: 1,
    },
    {
      id: 4,
      type: "multiple_choice",
      title: "[Q4] 뮤텍스/세마포어에 대한 설명으로 옳은 것은?",
      description: "동시성 제어 관련 문제입니다.",
      subject: "OS",
      options: [
        "뮤텍스는 동시에 여러 스레드가 소유할 수 있다.",
        "세마포어는 0 또는 1만 값으로 가질 수 있다.",
        "뮤텍스는 상호 배제를 위해 사용된다.",
        "세마포어는 동기화에 사용될 수 없다.",
      ],
      correctOptionIndex: 2,
    },
    {
      id: 5,
      type: "multiple_choice",
      title: "[Q5] 캐시 메모리에 대한 설명으로 옳은 것은?",
      description: "컴퓨터 구조 관련 문제입니다.",
      subject: "Computer Architecture",
      options: [
        "캐시는 항상 메인 메모리보다 용량이 크다.",
        "캐시는 CPU와 메인 메모리 사이에서 접근 속도를 높이기 위해 사용된다.",
        "캐시는 프로그램 코드만 저장할 수 있다.",
        "캐시는 하드디스크와 메모리 사이에만 존재한다.",
      ],
      correctOptionIndex: 1,
    },
  ];

  const questions: Question[] =
    battleMode === "cote" ? [coteQuestion] : miniQuestions;

  const TOTAL_QUESTIONS = questions.length;

  // =========================
  // 2. 상태들
  // =========================

  const [stage, setStage] = useState<BattleStage>("waiting");
  const [secondsLeft, setSecondsLeft] = useState(initialDuration);

  // 현재 문제 인덱스 (0 ~ TOTAL_QUESTIONS - 1)
  const [currentIndex, setCurrentIndex] = useState(0);

  // 현재 문제에 대한 입력값 (UI용)
  const [answer, setAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // 미니 모드 전체 답안 저장
  const [miniAnswers, setMiniAnswers] = useState<Record<number, MiniAnswer>>(
    {}
  );

  // 최종 제출 여부 (미니 모드)
  const [isFinalSubmitted, setIsFinalSubmitted] = useState(false);
  const [showWaitOpponentModal, setShowWaitOpponentModal] = useState(false);

  // 내 정답 개수 / 종료 시점 (미니 모드용)
  const [myCorrectCount, setMyCorrectCount] = useState(0);
  const [myFinishTime, setMyFinishTime] = useState<number | null>(null);

  // 결과 위젯용 (코테/미니 공통)
  const [battleResult, setBattleResult] = useState<
    "win" | "lose" | "draw" | null
  >(null);

  // 채팅
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, sender: "opponent", text: "GLHF 👋" },
  ]);
  const chatBodyRef = useRef<HTMLDivElement | null>(null);

  // 상대 진행 상황 (나중에 소켓/서버 이벤트로 교체)
  const [opponentSolved, setOpponentSolved] = useState(0);
  const [opponentStatusMessage, setOpponentStatusMessage] = useState(
    "상대가 아직 문제를 풀고 있습니다."
  );

  // 라이트/다크 모드
  const { theme, toggleTheme } = useTheme();

  // 모달
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const currentQuestion = questions[currentIndex];

  const isPlaying = stage === "playing";
  const canInteract = isPlaying && !isFinalSubmitted;

  const opponentProgressPercent =
    (opponentSolved / TOTAL_QUESTIONS) * 100;

  // =========================
  // 3. 유틸
  // =========================

  const formattedTime = () => {
    const m = Math.floor(secondsLeft / 60)
      .toString()
      .padStart(2, "0");
    const s = (secondsLeft % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // 현재 문제의 입력값을 miniAnswers에서 로딩
  useEffect(() => {
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
  }, [currentQuestion.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // =========================
  // 4. 타이머 & 단계 전환
  // =========================

  // DEV: 입장 후 1.2초 뒤 intro 로 전환
  useEffect(() => {
    if (stage !== "waiting") return;
    const id = setTimeout(() => setStage("intro"), 1200);
    return () => clearTimeout(id);
  }, [stage]);

  // playing 시작 시 타이머 리셋 (모드별)
  useEffect(() => {
    if (stage === "playing") {
      setSecondsLeft(initialDuration);
    }
  }, [stage, initialDuration]);

  // 타이머 감소
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
      // 시간 끝 → 강제 최종 제출 상태로 전환
      if (!isFinalSubmitted) {
        handleFinalSubmit(true);
      }
    } else {
      // 코테: 시간 종료 → 무승부 모달 (추후 서버 로직으로 대체)
      setStage("finished");
      setShowTimeUpModal(true);
    }
  }, [secondsLeft, isPlaying, battleMode, isFinalSubmitted]); // eslint-disable-line react-hooks/exhaustive-deps

  // 채팅 스크롤 자동 하단
  useEffect(() => {
    if (!chatBodyRef.current) return;
    const el = chatBodyRef.current;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  // =========================
  // 5. 핸들러들
  // =========================

  const saveCurrentAnswerToState = () => {
    if (battleMode !== "mini") return; // 코테는 서버 기준이라 여기선 스킵

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
    if (!canInteract) return;

    // 입력값 없으면 반환
    if (currentQuestion.type === "subjective") {
      if (!answer.trim()) return;
    } else {
      if (selectedOption === null) return;
    }

    // 로컬에 현재 문제 답안 저장
    saveCurrentAnswerToState();

    if (battleMode === "cote") {
      // ✅ 코테: 한 문제만 존재, 바로 서버에 제출 + 결과 대기
      console.log("코테 모드 답안 제출:", {
        questionId: currentQuestion.id,
        answerText:
          currentQuestion.type === "subjective"
            ? answer.trim()
            : undefined,
        selectedOption,
      });

      // TODO: API로 정답 제출 후, 서버에서 승/패 결과를 받아서 아래 함수를 호출
      // handleServerResult("win" | "lose");
      alert("코테 답안을 제출했습니다! (나중에 API 연동 예정)");
      setStage("finished");
      setBattleResult("draw"); // 임시
      return;
    }

    // ✅ 미니: 마지막 문제인지 여부에 따라
    const isLast = currentIndex === TOTAL_QUESTIONS - 1;

    if (!isLast) {
      // 다음 문제로 이동
      setCurrentIndex((prev) => Math.min(prev + 1, TOTAL_QUESTIONS - 1));
    } else {
      // 마지막 문제 → 최종 제출
      handleFinalSubmit(false);
    }
  };

  // 미니: 최종 제출 처리
  const handleFinalSubmit = (fromTimeUp: boolean) => {
    // 이미 제출했다면 무시
    if (isFinalSubmitted) return;

    // 남아있는 현재 문제 답변도 반영
    saveCurrentAnswerToState();

    // 내 종료 시점 기록 (경과 시간 기준)
    const elapsed = initialDuration - secondsLeft;
    setMyFinishTime(elapsed);

    // 간단한 정답 개수 계산 (예시용)
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
      // 주관식 채점은 추후 서버에서
    }
    setMyCorrectCount(correct);

    setIsFinalSubmitted(true);
    setStage("finished");

    // 상대 기다리는 위젯
    setShowWaitOpponentModal(true);

    console.log(
      "[미니 최종 제출]",
      fromTimeUp ? "시간 종료에 의한 자동 제출" : "사용자 최종 제출",
      {
        myCorrectCount: correct,
        myFinishTime: elapsed,
        answers: miniAnswers,
      }
    );

    // TODO: 서버에 최종 답안/스코어 전송
    // 이후 서버에서 상대 결과와 함께 승/패 알려주면 handleServerResult 호출
  };

  // 서버에서 결과를 받았다고 가정할 때 호출할 함수 (코테/미니 공통)
  const handleServerResult = (result: "win" | "lose" | "draw") => {
    setBattleResult(result);
    setShowWaitOpponentModal(false);
    setShowTimeUpModal(false);
    // stage는 finished 유지
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
    // TODO: 실제 나가기 로직 (라우팅 / 결과 처리)
    window.history.back();
  };

  // =========================
  // 6. 렌더링
  // =========================

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

      {/* 메인 헤더 */}
      <header className="loop-header">
        <div className="loop-match-info">
          <div className="loop-match-label">
            Battle #{matchId ?? "1"} ·{" "}
            {battleMode === "cote" ? "코딩 테스트" : "미니 퀴즈"}
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

            {/* 현재 문제 정보 */}
            <div className="loop-current-meta">
              <span className="loop-current-pill">현재 문제</span>
              <span className="loop-current-index">
                <span className="loop-current-index-strong">
                  {currentIndex + 1} / {TOTAL_QUESTIONS}
                </span>
              </span>
            </div>

            {/* 문제 텍스트 */}
            <div className="loop-question-body">
              <p className="loop-question-title">
                {currentQuestion.title}
              </p>
              <p className="loop-question-subtext">
                {currentQuestion.description}
              </p>
            </div>

            {/* 답안 영역 */}
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
                    ? "5문제 중 더 많이 맞추고, 동점이면 더 빨리 푼 사람이 승리합니다 🔥"
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

              {/* 미니 모드에서 문제 이동 버튼 (선택사항) */}
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

        {/* 오른쪽: 상대 진행 상황 + 채팅 */}
        <section className="loop-right">
          {/* 상대 진행 카드 */}
          <div className="loop-opponent-card">
            <div className="loop-opponent-header">
              <span className="loop-subtitle">상대 진행 상황</span>
              <span className="loop-opponent-name">
                {enemyNickname}
              </span>
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

      {/* (코테용) 무승부 / 시간초과 모달 */}
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

      {/* 미니 모드: 상대 기다리는 모달 */}
      {showWaitOpponentModal && (
        <div className="loop-modal-backdrop">
          <div className="loop-modal">
            <h2 className="loop-modal-title">
              최종 제출 완료! 🔔
            </h2>
            <p className="loop-modal-text">
              모든 문제의 답안을 제출했습니다. <br />
              이제 <strong>상대방이 모든 문제를 풀 때까지</strong>{" "}
              기다려 주세요.
              <br />
              (상대가 모든 문제를 해결하면 승/패가 결정됩니다.)
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

      {/* 승/패 결과 위젯 (코테/미니 공통) */}
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
