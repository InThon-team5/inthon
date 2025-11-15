// src/pages/BattlePage.tsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

type Stage = "waiting" | "intro" | "playing";

export default function BattlePage() {
  const { matchId } = useParams();

  // TODO: 나중에 authStore에서 가져오기
  const myNickname = "Jiwan"; 

  // TODO: 나중에 서버에서 상대 닉네임 들어오면 setEnemyNickname 호출
  const [enemyNickname, setEnemyNickname] = useState<string | null>(null);

  const [stage, setStage] = useState<Stage>("waiting");

  // enemyNickname이 생기면 VS 인트로 → 일정 시간 뒤 playing으로 전환
  useEffect(() => {
    if (enemyNickname && stage === "waiting") {
      setStage("intro");
      const timer = setTimeout(() => {
        setStage("playing");
      }, 1500); // 1.5초 후에 실제 배틀 화면으로

      return () => clearTimeout(timer);
    }
  }, [enemyNickname, stage]);

  // ---- 개발용: 버튼 눌러서 상대 입장 시뮬레이션 ----
  const mockJoinEnemy = () => {
    if (!enemyNickname) {
      setEnemyNickname("Enemy123");
    }
  };
  // ---------------------------------------------

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 flex flex-col gap-4 relative">
      {/* VS 인트로 오버레이 */}
      {stage === "intro" && enemyNickname && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="text-sm uppercase tracking-[0.3em] text-slate-400 mb-2">
              Battle Start
            </div>
            <div className="flex items-center gap-4 justify-center">
              <span className="text-3xl md:text-5xl font-extrabold tracking-widest animate-pulse text-emerald-400">
                {myNickname}
              </span>
              <span className="text-2xl md:text-4xl font-black text-slate-300">
                VS
              </span>
              <span className="text-3xl md:text-5xl font-extrabold tracking-widest animate-pulse text-rose-400">
                {enemyNickname}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 상단 헤더 */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl text-emerald-400 font-bold">Battle #{matchId}</h2>
          <h2 className="text-xl font-bold">
            Battle #{matchId}
          </h2>
          <p className="text-xs text-slate-400">
            OS / 자료구조 / 알고리즘 등 카테고리 텍스트
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2 text-sm">
            <span className="px-2 py-1 rounded-full bg-slate-800">
              {myNickname}
            </span>
            <span className="px-2 py-1 rounded-full bg-slate-800">
              {enemyNickname ?? "waiting..."}
            </span>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">남은 시간</div>
            <div className="text-2xl font-mono">03:00</div>
          </div>
        </div>
      </header>

      {/* 본문 */}
      {stage === "waiting" && (
        <WaitingView
          myNickname={myNickname}
          onMockJoin={mockJoinEnemy} // 나중엔 제거하고 서버 이벤트로 대체
        />
      )}

      {stage === "playing" && (
        <PlayingView myNickname={myNickname} enemyNickname={enemyNickname} />
      )}

      {/* stage === "intro" 인 동안은 뒤에 기존 레이아웃 그대로 있고,
          위의 fixed 오버레이만 잠깐 덮고 있다가 사라지는 구조 */}
    </div>
  );
}

// ====== 컴포넌트 쪼개기 ======

interface WaitingViewProps {
  myNickname: string;
  onMockJoin: () => void;
}

function WaitingView({ myNickname, onMockJoin }: WaitingViewProps) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center">
      <div className="border border-dashed border-slate-700 rounded-2xl px-8 py-10 text-center max-w-lg w-full bg-slate-900/40">
        <div className="text-sm text-slate-400 mb-3">
          상대를 기다리는 중입니다...
        </div>
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-400 text-emerald-300 font-semibold">
            {myNickname}
          </span>
          <span className="text-slate-500 font-bold">VS</span>
          <span className="px-4 py-2 rounded-full bg-slate-800 border border-slate-600 text-slate-500">
            waiting...
          </span>
        </div>
        <p className="text-xs text-slate-500">
          방 링크를 친구에게 보내거나, 랜덤 매칭을 통해 상대가 들어오면
          배틀이 자동으로 시작됩니다.
        </p>

        {/* 개발용 버튼: 진짜 구현할 땐 삭제 */}
        <button
          onClick={onMockJoin}
          className="mt-6 text-xs px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700"
        >
          🔧 개발용: 상대 입장 시뮬레이션
        </button>
      </div>
    </main>
  );
}

interface PlayingViewProps {
  myNickname: string;
  enemyNickname: string | null;
}

function PlayingView({ myNickname, enemyNickname }: PlayingViewProps) {
  return (
    <main className="flex-1 grid grid-cols-1 lg:grid-cols-[2fr,1.1fr] gap-4 mt-2">
      {/* 문제 영역 */}
      <section className="border border-slate-800 rounded-2xl p-4 bg-slate-900/60 flex flex-col">
        <h3 className="font-semibold mb-2 text-sm text-slate-200">
          문제
        </h3>
        <div className="flex-1 overflow-auto text-sm text-slate-300 space-y-2">
          <p className="font-medium">
            [예시] 운영체제: 프로세스 & 스레드 기본
          </p>
          <p>
            프로세스와 스레드의 차이를 설명하고, 멀티스레딩의 장점과 단점을
            간단히 서술하시오.
          </p>
          {/* 여기에 나중에 문제 타입(단답 / 코테)에 따라 다른 UI 렌더링 */}
        </div>

        <div className="mt-4">
          <textarea
            className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm font-mono resize-none"
            placeholder="여기에 답안을 작성하세요. (코드/단답/설명 등)"
          />
          <button className="mt-3 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold text-sm">
            제출하기
          </button>
        </div>
      </section>

      {/* 우측: 플레이어 정보 + 채팅 */}
      <section className="border border-slate-800 rounded-2xl p-4 bg-slate-900/60 flex flex-col gap-3">
        {/* 플레이어 카드 */}
        <div className="flex items-center justify-between gap-2 text-sm">
          <div className="flex-1">
            <div className="text-xs text-slate-400 mb-1">You</div>
            <div className="px-3 py-2 rounded-xl bg-slate-950 border border-emerald-500/60 text-emerald-300 font-semibold">
              {myNickname}
            </div>
          </div>
          <div className="flex-1 text-right">
            <div className="text-xs text-slate-400 mb-1">Opponent</div>
            <div className="px-3 py-2 rounded-xl bg-slate-950 border border-rose-500/60 text-rose-300 font-semibold">
              {enemyNickname ?? "???"}
            </div>
          </div>
        </div>

        {/* 채팅 */}
        <div className="flex-1 flex flex-col mt-1">
          <h3 className="font-semibold mb-2 text-xs text-slate-300">
            실시간 채팅
          </h3>
          <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-2 text-xs text-slate-300 overflow-auto">
            {/* TODO: 메시지 리스트 */}
            <p className="text-slate-500">아직 메시지가 없습니다.</p>
          </div>
          <div className="mt-2 flex gap-2">
            <input
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs"
              placeholder="GLHF, GG 등 메시지 입력"
            />
            <button className="px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs">
              전송
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
