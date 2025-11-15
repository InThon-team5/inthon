// src/components/BattleIntroOverlay.tsx
import { useEffect } from "react";

interface BattleIntroOverlayProps {
  myNickname: string;
  enemyNickname: string;
  onDone: () => void;
}

export function BattleIntroOverlay({
  myNickname,
  enemyNickname,
  onDone,
}: BattleIntroOverlayProps) {
  // 2.4초 후 자동 종료 (애니메이션 다 돌고 나서)
  useEffect(() => {
    const id = setTimeout(() => onDone(), 2400);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <div className="intro-root fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-slate-950">
      {/* 배경: 그라데이션 + 빛나는 라인들 */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-slate-950 to-rose-500/20" />
      <div className="pointer-events-none absolute inset-[-40%] bg-[radial-gradient(circle_at_center,rgba(248,250,252,0.18),transparent_60%)] blur-2xl" />

      {/* 대각선 라인 */}
      <div className="pointer-events-none absolute -left-1/3 -top-1/3 w-[80%] h-[2px] bg-gradient-to-r from-transparent via-slate-300/30 to-transparent rotate-12" />
      <div className="pointer-events-none absolute -right-1/3 -bottom-1/3 w-[80%] h-[2px] bg-gradient-to-r from-transparent via-slate-300/30 to-transparent -rotate-12" />

      {/* 중앙 컨테이너 */}
      <div className="relative z-10 flex flex-col items-center gap-6 md:gap-8 intro-container">
        {/* 상단 라벨 */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-[10px] md:text-xs tracking-[0.35em] uppercase text-slate-300/80">
            KU INFO BATTLE
          </div>
          <div className="text-[11px] md:text-xs text-slate-400">
            고려대학교 정보대학 · 실시간 코딩 배틀
          </div>
        </div>

        {/* 닉네임 + VS */}
        <div className="flex items-center gap-6 md:gap-12 lg:gap-16">
          {/* 내 닉네임 */}
          <div className="intro-slide-left">
            <div className="px-6 md:px-8 py-4 md:py-5 rounded-3xl bg-slate-950/80 border border-emerald-400/80 shadow-[0_0_40px_rgba(16,185,129,0.75)]">
              <div className="text-[11px] md:text-xs text-emerald-300/80 mb-1 tracking-[0.2em] uppercase">
                YOU
              </div>
              <div className="intro-name text-3xl md:text-4xl lg:text-5xl font-extrabold text-emerald-300">
                {myNickname}
              </div>
            </div>
          </div>

          {/* VS 동그라미 */}
          <div className="relative">
            <div className="intro-vs-pop w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full border-[3px] border-slate-100/80 flex items-center justify-center bg-slate-950/95 shadow-[0_0_60px_rgba(248,250,252,0.85)]">
              <span className="text-2xl md:text-3xl lg:text-4xl font-black tracking-[0.2em]">
                VS
              </span>
            </div>
            {/* VS 주변 링 효과 */}
            <div className="pointer-events-none absolute inset-[-10px] rounded-full border border-slate-200/20 intro-ring" />
          </div>

          {/* 상대 닉네임 */}
          <div className="intro-slide-right">
            <div className="px-6 md:px-8 py-4 md:py-5 rounded-3xl bg-slate-950/80 border border-rose-400/80 shadow-[0_0_40px_rgba(248,113,113,0.75)] text-right">
              <div className="text-[11px] md:text-xs text-rose-300/80 mb-1 tracking-[0.2em] uppercase">
                OPPONENT
              </div>
              <div className="intro-name text-3xl md:text-4xl lg:text-5xl font-extrabold text-rose-300">
                {enemyNickname}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 문구 */}
        <div className="flex flex-col items-center gap-1">
          <div className="intro-sub text-[11px] md:text-xs text-slate-300">
            ROUND 1 · 첫 번째 문제 공개까지
          </div>
          <div className="intro-count text-2xl md:text-3xl lg:text-4xl font-bold tracking-[0.3em] text-slate-50">
            3 · 2 · 1
          </div>
        </div>
      </div>
    </div>
  );
}
