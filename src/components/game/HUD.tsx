import { useState, useEffect, useRef } from 'react';

interface KillFeedEntry {
  id: number;
  text: string;
  isHeadshot: boolean;
  time: number;
}

interface HUDProps {
  started: boolean;
  score: number;
  shots: number;
  streak: number;
  bestStreak: number;
  showHitMarker: boolean;
  showHeadshotMarker: boolean;
  showMuzzleFlash: boolean;
  crosshairSpread: number;
  killFeed: KillFeedEntry[];
  txList: { id: number; status: 'pending' | 'done' | 'fail'; hash?: string }[];
}

export default function HUD({
  started,
  score,
  shots,
  streak,
  bestStreak,
  showHitMarker,
  showHeadshotMarker,
  showMuzzleFlash,
  crosshairSpread,
  killFeed,
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

  const now = Date.now();
  const activeKillFeed = killFeed.filter((k) => now - k.time < 2000);

  return (
    <div className="pointer-events-none fixed inset-0 z-30" style={{ fontFamily: 'monospace' }}>
      {/* Dynamic Crosshair — 4 lines that expand on shoot */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Center dot */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-[2px] rounded-full bg-white" />
        {/* Top */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bg-white/80"
          style={{
            width: 2,
            height: 12,
            bottom: 6 + crosshairSpread,
            transition: 'bottom 0.08s ease-out',
          }}
        />
        {/* Bottom */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bg-white/80"
          style={{
            width: 2,
            height: 12,
            top: 6 + crosshairSpread,
            transition: 'top 0.08s ease-out',
          }}
        />
        {/* Left */}
        <div
          className="absolute top-1/2 -translate-y-1/2 bg-white/80"
          style={{
            width: 12,
            height: 2,
            right: 6 + crosshairSpread,
            transition: 'right 0.08s ease-out',
          }}
        />
        {/* Right */}
        <div
          className="absolute top-1/2 -translate-y-1/2 bg-white/80"
          style={{
            width: 12,
            height: 2,
            left: 6 + crosshairSpread,
            transition: 'left 0.08s ease-out',
          }}
        />
      </div>

      {/* Hit marker — thick white X */}
      {showHitMarker && !showHeadshotMarker && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className="absolute bg-white"
            style={{
              width: 24,
              height: 3,
              transform: 'rotate(45deg)',
              left: -12,
              top: -1.5,
              boxShadow: '0 0 8px rgba(255,255,255,0.6)',
            }}
          />
          <div
            className="absolute bg-white"
            style={{
              width: 24,
              height: 3,
              transform: 'rotate(-45deg)',
              left: -12,
              top: -1.5,
              boxShadow: '0 0 8px rgba(255,255,255,0.6)',
            }}
          />
        </div>
      )}

      {/* Headshot marker — red X with pulse */}
      {showHeadshotMarker && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping">
          <div
            className="absolute"
            style={{
              width: 28,
              height: 3,
              transform: 'rotate(45deg)',
              left: -14,
              top: -1.5,
              background: '#ff3333',
              boxShadow: '0 0 12px rgba(255,50,50,0.8)',
            }}
          />
          <div
            className="absolute"
            style={{
              width: 28,
              height: 3,
              transform: 'rotate(-45deg)',
              left: -14,
              top: -1.5,
              background: '#ff3333',
              boxShadow: '0 0 12px rgba(255,50,50,0.8)',
            }}
          />
        </div>
      )}

      {/* Muzzle flash overlay */}
      {showMuzzleFlash && (
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 60%, rgba(255,160,40,0.12) 0%, transparent 35%)',
          }}
        />
      )}

      {/* "Click to start" prompt */}
      {!started && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 mt-24 pointer-events-auto">
          <div className="text-[#cccccc] text-base animate-pulse text-center font-bold tracking-widest">
            CLICK TO START
          </div>
          <div className="text-[#666666] text-xs text-center mt-2">
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

      {/* Kill Feed — top right */}
      {activeKillFeed.length > 0 && (
        <div className="absolute top-14 right-3 flex flex-col gap-1.5">
          {activeKillFeed.map((entry) => {
            const age = now - entry.time;
            const opacity = Math.max(0, 1 - age / 2000);
            return (
              <div
                key={entry.id}
                className={`px-3 py-1.5 rounded text-xs font-bold tracking-wider ${
                  entry.isHeadshot
                    ? 'bg-red-900/80 border border-red-500/50 text-red-300'
                    : 'bg-gray-900/80 border border-gray-600/50 text-gray-200'
                }`}
                style={{ opacity, transition: 'opacity 0.3s' }}
              >
                {entry.text}
              </div>
            );
          })}
        </div>
      )}

      {/* Ammo display — bottom right */}
      {started && (
        <div className="absolute bottom-16 right-6">
          <div className="text-white/60 text-[10px] tracking-wider mb-1">AMMO</div>
          <div className="text-white text-3xl font-bold tabular-nums" style={{ fontFamily: 'monospace' }}>
            &infin; / &infin;
          </div>
        </div>
      )}

      {/* Combo counter */}
      {started && streak >= 3 && (
        <div className="absolute top-1/2 right-8 -translate-y-1/2">
          <div
            className="text-4xl font-black tracking-wider"
            style={{
              background: 'linear-gradient(135deg, #ffcc00, #ff8800)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: 'none',
              filter: 'drop-shadow(0 0 8px rgba(255,200,0,0.4))',
            }}
          >
            {streak}X COMBO
          </div>
        </div>
      )}

      {/* Score — bottom center */}
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

      {/* Stats — bottom left */}
      {started && (
        <div className="absolute bottom-6 left-6 flex items-center gap-4">
          <span className="text-white/40 text-xs">
            ACC <span className="text-white/70">{accuracy}%</span>
          </span>
          <span className="text-white/40 text-xs">
            STREAK <span className="text-white/70">{streak}</span>
          </span>
          {bestStreak > 0 && (
            <span className="text-white/40 text-xs">
              BEST <span className="text-white/70">{bestStreak}</span>
            </span>
          )}
          <span className="text-white/40 text-xs">
            SHOTS <span className="text-white/70">{shots}</span>
          </span>
        </div>
      )}

      {/* TX notifications — below kill feed or top right if no kill feed */}
      <div className="absolute top-14 right-3 flex flex-col gap-1.5" style={{ marginTop: activeKillFeed.length * 32 }}>
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
