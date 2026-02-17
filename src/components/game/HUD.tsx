import { useState, useEffect, useRef } from 'react';

interface HUDProps {
  started: boolean;
  score: number;
  shots: number;
  streak: number;
  bestStreak: number;
  showHitMarker: boolean;
  showMuzzleFlash: boolean;
  txList: { id: number; status: 'pending' | 'done' | 'fail'; hash?: string }[];
}

export default function HUD({
  started,
  score,
  shots,
  streak,
  bestStreak,
  showHitMarker,
  showMuzzleFlash,
  txList,
}: HUDProps) {
  const accuracy = shots > 0 ? Math.round((score / shots) * 100) : 0;
  const visibleTxs = txList.slice(-5);
  const [showGo, setShowGo] = useState(false);
  const startedPrev = useRef(false);

  useEffect(() => {
    if (started && !startedPrev.current) {
      setShowGo(true);
      const timer = setTimeout(() => setShowGo(false), 500);
      startedPrev.current = true;
      return () => clearTimeout(timer);
    }
  }, [started]);

  return (
    <div className="pointer-events-none fixed inset-0 z-30" style={{ fontFamily: 'monospace' }}>
      {/* Crosshair */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Center dot */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[3px] h-[3px] rounded-full bg-white" />
        {/* Top line */}
        <div className="absolute left-1/2 -translate-x-1/2 bg-white/80" style={{ width: 2, height: 10, bottom: 8 }} />
        {/* Bottom line */}
        <div className="absolute left-1/2 -translate-x-1/2 bg-white/80" style={{ width: 2, height: 10, top: 8 }} />
        {/* Left line */}
        <div className="absolute top-1/2 -translate-y-1/2 bg-white/80" style={{ width: 10, height: 2, right: 8 }} />
        {/* Right line */}
        <div className="absolute top-1/2 -translate-y-1/2 bg-white/80" style={{ width: 10, height: 2, left: 8 }} />
      </div>

      {/* Hit marker - white X */}
      {showHitMarker && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="absolute bg-white" style={{ width: 20, height: 2, transform: 'rotate(45deg)', left: -10, top: -1 }} />
          <div className="absolute bg-white" style={{ width: 20, height: 2, transform: 'rotate(-45deg)', left: -10, top: -1 }} />
        </div>
      )}

      {/* Muzzle flash overlay */}
      {showMuzzleFlash && (
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 60%, rgba(255,160,40,0.15) 0%, transparent 40%)',
          }}
        />
      )}

      {/* "Click to start" prompt */}
      {!started && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 mt-24 pointer-events-auto">
          <div className="text-[#6aa3ff] text-base animate-pulse text-center">
            CLICK TO START
          </div>
          <div className="text-[#3a4a70] text-xs text-center mt-2">
            Mouse to aim / Click to shoot / ESC to exit
          </div>
        </div>
      )}

      {/* GO! flash */}
      {showGo && (
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#ff8800] text-7xl font-bold animate-ping"
          style={{ textShadow: '0 0 30px rgba(255,136,0,0.5)' }}
        >
          GO!
        </div>
      )}

      {/* Score - bottom center */}
      {started && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center">
          <div
            className="text-white text-5xl font-bold tabular-nums"
            style={{ textShadow: '0 0 20px rgba(255,140,30,0.3)' }}
          >
            {score}
          </div>
        </div>
      )}

      {/* Stats - bottom left */}
      {started && (
        <div className="absolute bottom-6 left-6 flex items-center gap-4">
          <span className="text-[#6a7aaa] text-xs">
            ACC <span className="text-[#8a9acc]">{accuracy}%</span>
          </span>
          <span className="text-[#6a5aaa] text-xs">
            STREAK <span className="text-[#9a8acc]">{streak}</span>
          </span>
          {bestStreak > 0 && (
            <span className="text-[#5a6aaa] text-xs">
              BEST <span className="text-[#8a9acc]">{bestStreak}</span>
            </span>
          )}
        </div>
      )}

      {/* Shots - bottom right */}
      {started && (
        <div className="absolute bottom-6 right-6">
          <span className="text-[#6a7aaa] text-xs">
            SHOTS <span className="text-[#8a9acc]">{shots}</span>
          </span>
        </div>
      )}

      {/* TX notifications */}
      <div className="absolute top-14 right-3 flex flex-col gap-1.5">
        {visibleTxs.map((tx, i) => (
          <div
            key={tx.id}
            className={`flex items-center gap-2 rounded px-2.5 py-1 text-xs backdrop-blur-sm transition-all duration-300 ${
              tx.status === 'pending'
                ? 'bg-[#0d1020]/80 border border-[#ff8020]/20 text-[#ff8020]'
                : tx.status === 'done'
                ? 'bg-[#0d2010]/80 border border-[#30ff60]/20 text-[#30ff60]'
                : 'bg-[#200d0d]/80 border border-[#ff3030]/20 text-[#ff3030]'
            }`}
            style={{ opacity: 1 - i * 0.05 }}
          >
            <div
              className={`h-1.5 w-1.5 rounded-full ${
                tx.status === 'pending'
                  ? 'bg-[#ff8020] animate-pulse'
                  : tx.status === 'done'
                  ? 'bg-[#30ff60]'
                  : 'bg-[#ff3030]'
              }`}
            />
            {tx.status === 'pending'
              ? 'TX...'
              : tx.status === 'done'
              ? `TX ${tx.hash ? tx.hash.slice(0, 6) : ''}`
              : 'FAIL'}
          </div>
        ))}
      </div>
    </div>
  );
}
