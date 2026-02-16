'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface Target {
  id: number;
  x: number;
  y: number;
  size: number;
  hit: boolean;
  hitTime: number;
  spawnTime: number;
  speedX: number;
  speedY: number;
  type: 'fluffey' | 'meka';
  bobPhase: number;
}

function generateTarget(id: number): Target {
  return {
    id,
    x: 15 + Math.random() * 70,
    y: 12 + Math.random() * 55,
    size: 28 + Math.random() * 18,
    hit: false,
    hitTime: 0,
    spawnTime: Date.now() + id * 20,
    speedX: (Math.random() - 0.5) * 2.5 + (Math.random() > 0.5 ? 0.5 : -0.5),
    speedY: (Math.random() - 0.5) * 1.8 + (Math.random() > 0.5 ? 0.3 : -0.3),
    type: Math.random() > 0.4 ? 'fluffey' : 'meka',
    bobPhase: Math.random() * Math.PI * 2,
  };
}

interface HitEffect {
  x: number;
  y: number;
  time: number;
}

interface GameProps {
  onShoot: (hit: boolean) => void;
  txList: { id: number; status: 'pending' | 'done' | 'fail'; hash?: string }[];
}

export default function Game({ onShoot, txList }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextIdRef = useRef(0);
  const targetsRef = useRef<Target[]>([]);
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [started, setStarted] = useState(false);
  const showGoRef = useRef(false);
  const showGoTime = useRef(0);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const hitEffectsRef = useRef<HitEffect[]>([]);
  const timeRef = useRef(0);
  const fluffeyImg = useRef<HTMLImageElement | null>(null);
  const mekaImg = useRef<HTMLImageElement | null>(null);

  // Load rabbit images
  useEffect(() => {
    const f = new Image();
    f.src = '/fluffey.png';
    f.onload = () => { fluffeyImg.current = f; };
    const m = new Image();
    m.src = '/meka.png';
    m.onload = () => { mekaImg.current = m; };
  }, []);

  // Spawn initial wave
  const spawnWave = useCallback(() => {
    const count = 5 + Math.floor(Math.random() * 4);
    const newTargets: Target[] = [];
    for (let i = 0; i < count; i++) {
      newTargets.push(generateTarget(nextIdRef.current++));
    }
    targetsRef.current = newTargets;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    timeRef.current += 0.016;
    const time = timeRef.current;
    const now = Date.now();

    // === ROOM BACKGROUND ===
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0a0c10');
    bgGrad.addColorStop(0.4, '#0d1017');
    bgGrad.addColorStop(0.7, '#0f1219');
    bgGrad.addColorStop(1, '#0a0c10');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Wall tile lines
    ctx.strokeStyle = '#1a1e2a';
    ctx.lineWidth = 1;
    const tile = 80;
    for (let x = 0; x < w; x += tile) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += tile) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Blue neon edges
    const topGlow = ctx.createLinearGradient(0, 0, 0, 6);
    topGlow.addColorStop(0, 'rgba(60,130,255,0.35)');
    topGlow.addColorStop(1, 'rgba(60,130,255,0)');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, w, 6);

    const botGlow = ctx.createLinearGradient(0, h - 6, 0, h);
    botGlow.addColorStop(0, 'rgba(60,130,255,0)');
    botGlow.addColorStop(1, 'rgba(60,130,255,0.25)');
    ctx.fillStyle = botGlow;
    ctx.fillRect(0, h - 6, w, 6);

    // Subtle blue neon accents
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = '#3c82ff';
    for (let y = tile; y < h; y += tile * 2) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // === TARGET SCREEN AREA ===
    const sL = w * 0.12, sT = h * 0.08, sW = w * 0.76, sH = h * 0.7;

    // Screen bg - dark checkered
    ctx.fillStyle = '#0c0e14';
    ctx.fillRect(sL, sT, sW, sH);
    const grid = 40;
    for (let gx = 0; gx < sW; gx += grid) {
      for (let gy = 0; gy < sH; gy += grid) {
        const alt = ((Math.floor(gx / grid) + Math.floor(gy / grid)) % 2) === 0;
        ctx.fillStyle = alt ? '#0e1018' : '#11141e';
        ctx.fillRect(sL + gx, sT + gy, grid, grid);
      }
    }

    // Grid lines
    ctx.strokeStyle = '#1a1f30';
    ctx.lineWidth = 0.5;
    for (let gx = 0; gx <= sW; gx += grid) {
      ctx.beginPath(); ctx.moveTo(sL + gx, sT); ctx.lineTo(sL + gx, sT + sH); ctx.stroke();
    }
    for (let gy = 0; gy <= sH; gy += grid) {
      ctx.beginPath(); ctx.moveTo(sL, sT + gy); ctx.lineTo(sL + sW, sT + gy); ctx.stroke();
    }

    // Blue border frame with glow
    ctx.strokeStyle = '#3c82ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#3c82ff';
    ctx.shadowBlur = 10;
    ctx.strokeRect(sL, sT, sW, sH);
    ctx.shadowBlur = 0;

    // Corner accents
    const cLen = 18;
    ctx.strokeStyle = '#6aa3ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(sL, sT + cLen); ctx.lineTo(sL, sT); ctx.lineTo(sL + cLen, sT); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sL + sW - cLen, sT); ctx.lineTo(sL + sW, sT); ctx.lineTo(sL + sW, sT + cLen); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sL, sT + sH - cLen); ctx.lineTo(sL, sT + sH); ctx.lineTo(sL + cLen, sT + sH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sL + sW - cLen, sT + sH); ctx.lineTo(sL + sW, sT + sH); ctx.lineTo(sL + sW, sT + sH - cLen); ctx.stroke();

    // === RABBITS / TARGETS ===
    if (started) {
      const targets = targetsRef.current;
      const aliveCount = targets.filter(t => !t.hit).length;

      if (aliveCount === 0 && now - (targets[0]?.hitTime || 0) > 350) {
        spawnWave();
      }

      for (const t of targets) {
        const px = (t.x / 100) * w;
        const py = (t.y / 100) * h;
        const r = t.size * (w / 1200);

        if (t.hit) {
          const elapsed = now - t.hitTime;
          if (elapsed > 350) continue;
          const p = elapsed / 350;
          ctx.globalAlpha = 1 - p;
          // Orange burst
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const d = p * r * 2.5;
            ctx.fillStyle = i % 2 === 0 ? '#ffa030' : '#ffcc60';
            ctx.beginPath();
            ctx.arc(px + Math.cos(a) * d, py + Math.sin(a) * d, 3 * (1 - p), 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
          continue;
        }

        if (now < t.spawnTime) continue;

        // Move
        t.x += t.speedX;
        t.y += t.speedY;
        if (t.x < 14 || t.x > 86) t.speedX *= -1;
        if (t.y < 11 || t.y > 68) t.speedY *= -1;
        t.x = Math.max(14, Math.min(86, t.x));
        t.y = Math.max(11, Math.min(68, t.y));

        // Bob
        const bob = Math.sin(time * 2.5 + t.bobPhase) * 3;
        const drawY = py + bob;

        // Shadow
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(px, sT + sH - 5, r * 0.5, r * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Glow
        const glowCol = t.type === 'fluffey' ? 'rgba(245,175,148,0.12)' : 'rgba(144,215,159,0.12)';
        const glow = ctx.createRadialGradient(px, drawY, r * 0.2, px, drawY, r * 1.6);
        glow.addColorStop(0, glowCol);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, drawY, r * 1.6, 0, Math.PI * 2);
        ctx.fill();

        // Draw rabbit image
        const img = t.type === 'fluffey' ? fluffeyImg.current : mekaImg.current;
        const drawSize = r * 2.8;
        if (img) {
          ctx.drawImage(img, px - drawSize / 2, drawY - drawSize / 2, drawSize, drawSize);
        } else {
          // Fallback colored circle
          ctx.fillStyle = t.type === 'fluffey' ? '#F5AF94' : '#90D79F';
          ctx.beginPath();
          ctx.arc(px, drawY, r, 0, Math.PI * 2);
          ctx.fill();
        }

        // Pulsing ring
        const pulse = Math.sin(time * 3 + t.id) * 0.5 + 0.5;
        ctx.strokeStyle = t.type === 'fluffey'
          ? `rgba(245,175,148,${0.15 + pulse * 0.15})`
          : `rgba(144,215,159,${0.15 + pulse * 0.15})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, drawY, r * 1.2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // === HIT EFFECTS ===
    const effects = hitEffectsRef.current;
    for (let i = effects.length - 1; i >= 0; i--) {
      const e = effects[i];
      const elapsed = now - e.time;
      if (elapsed > 600) { effects.splice(i, 1); continue; }
      const p = elapsed / 600;
      ctx.globalAlpha = 1 - p;
      ctx.fillStyle = '#ffa030';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('+1', e.x, e.y - p * 35);
      ctx.globalAlpha = 1;
    }

    // === "SHOOT TO START" ===
    if (!started) {
      const cx = w / 2, cy = h * 0.44;
      // Reticle circles
      ctx.strokeStyle = 'rgba(100,160,255,0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, 50, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 35, 0, Math.PI * 2); ctx.stroke();
      // Reticle cross
      ctx.strokeStyle = 'rgba(100,160,255,0.18)';
      ctx.beginPath();
      ctx.moveTo(cx - 55, cy); ctx.lineTo(cx - 18, cy);
      ctx.moveTo(cx + 18, cy); ctx.lineTo(cx + 55, cy);
      ctx.moveTo(cx, cy - 55); ctx.lineTo(cx, cy - 18);
      ctx.moveTo(cx, cy + 18); ctx.lineTo(cx, cy + 55);
      ctx.stroke();
      // Text
      const pa = 0.5 + Math.sin(time * 2) * 0.3;
      ctx.globalAlpha = pa;
      ctx.fillStyle = '#6aa3ff';
      ctx.font = '15px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SHOOT TO START', cx, cy + 75);
      ctx.globalAlpha = 1;
    }

    // === "GO!" flash ===
    if (showGoRef.current && now - showGoTime.current < 500) {
      const p = (now - showGoTime.current) / 500;
      ctx.globalAlpha = 1 - p;
      ctx.fillStyle = '#ff8800';
      ctx.font = 'bold 64px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 15;
      ctx.fillText('GO!', w / 2, h * 0.44);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    } else {
      showGoRef.current = false;
    }

    // === PISTOL ===
    const gx = w / 2 + 70, gy = h - 15;
    ctx.fillStyle = '#1a1c22';
    ctx.beginPath();
    ctx.moveTo(gx - 28, gy); ctx.lineTo(gx - 22, gy - 60); ctx.lineTo(gx + 18, gy - 65);
    ctx.lineTo(gx + 22, gy - 55); ctx.lineTo(gx + 20, gy - 28); ctx.lineTo(gx + 8, gy);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#22252e';
    ctx.fillRect(gx - 6, gy - 92, 16, 30);
    ctx.fillStyle = '#ff7020';
    ctx.shadowColor = '#ff7020'; ctx.shadowBlur = 5;
    ctx.fillRect(gx - 4, gy - 50, 10, 2);
    ctx.fillRect(gx - 2, gy - 44, 7, 2);
    ctx.shadowBlur = 0;

    // === CROSSHAIR - green + ===
    const mx = mouseRef.current.x, my = mouseRef.current.y;
    ctx.strokeStyle = '#30ff60';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mx - 10, my); ctx.lineTo(mx - 3, my);
    ctx.moveTo(mx + 3, my); ctx.lineTo(mx + 10, my);
    ctx.moveTo(mx, my - 10); ctx.lineTo(mx, my - 3);
    ctx.moveTo(mx, my + 3); ctx.lineTo(mx, my + 10);
    ctx.stroke();

    // === FLOOR ===
    const floorY = sT + sH + 12;
    const fGrad = ctx.createLinearGradient(0, floorY, 0, h);
    fGrad.addColorStop(0, '#0e1118');
    fGrad.addColorStop(1, '#090b0f');
    ctx.fillStyle = fGrad;
    ctx.fillRect(0, floorY, w, h - floorY);
    ctx.strokeStyle = '#1a1e28';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 12; i++) {
      const fx = (w / 2) + (i - 6) * 110;
      ctx.beginPath(); ctx.moveTo(w / 2, floorY); ctx.lineTo(fx, h); ctx.stroke();
    }

    animRef.current = requestAnimationFrame(draw);
  }, [started, spawnWave]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const onMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', onMove);
    animRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(animRef.current);
    };
  }, [draw]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = canvas.width, h = canvas.height;
      const cx = e.clientX, cy = e.clientY;

      if (!started) {
        setStarted(true);
        showGoRef.current = true;
        showGoTime.current = Date.now();
        spawnWave();
        return;
      }

      setShots(s => s + 1);
      let hitAny = false;
      const now = Date.now();

      for (const t of targetsRef.current) {
        if (t.hit || now < t.spawnTime) continue;
        const px = (t.x / 100) * w;
        const py = (t.y / 100) * h;
        const r = t.size * (w / 1200) * 1.4; // generous hitbox for image
        const dist = Math.sqrt((cx - px) ** 2 + (cy - py) ** 2);
        if (dist <= r) {
          t.hit = true;
          t.hitTime = now;
          hitAny = true;
          setScore(s => s + 1);
          setStreak(s => {
            const ns = s + 1;
            setBestStreak(b => Math.max(b, ns));
            return ns;
          });
          hitEffectsRef.current.push({ x: px, y: py, time: now });
          break;
        }
      }

      if (!hitAny) setStreak(0);
      onShoot(hitAny);
    },
    [onShoot, started, spawnWave]
  );

  const accuracy = shots > 0 ? Math.round((score / shots) * 100) : 0;

  // TX list - show last 5, stacked from bottom
  const visibleTxs = txList.slice(-5);

  return (
    <div className="relative h-screen w-screen bg-[#090b0f]" style={{ cursor: 'none' }}>
      <canvas ref={canvasRef} onClick={handleClick} className="block h-full w-full" />

      {/* Score - bottom center */}
      {started && (
        <div className="pointer-events-none fixed bottom-20 left-0 right-0 z-40 flex justify-center">
          <div className="text-white font-mono text-5xl font-bold tabular-nums" style={{ textShadow: '0 0 20px rgba(255,140,30,0.3)' }}>
            {score}
          </div>
        </div>
      )}

      {/* Stats - subtle corners */}
      {started && (
        <>
          <div className="pointer-events-none fixed bottom-6 left-6 z-40 flex items-center gap-4">
            <span className="text-[#6a7aaa] font-mono text-xs">ACC <span className="text-[#8a9acc]">{accuracy}%</span></span>
            <span className="text-[#6a5aaa] font-mono text-xs">STREAK <span className="text-[#9a8acc]">{streak}</span></span>
            {bestStreak > 0 && <span className="text-[#5a6aaa] font-mono text-xs">BEST <span className="text-[#8a9acc]">{bestStreak}</span></span>}
          </div>
          <div className="pointer-events-none fixed bottom-6 right-6 z-40">
            <span className="text-[#6a7aaa] font-mono text-xs">SHOTS <span className="text-[#8a9acc]">{shots}</span></span>
          </div>
        </>
      )}

      {/* TX notifications - stacked from bottom, max 5 */}
      <div className="fixed top-14 right-3 z-40 flex flex-col gap-1.5">
        {visibleTxs.map((tx, i) => (
          <div
            key={tx.id}
            className={`flex items-center gap-2 rounded px-2.5 py-1 font-mono text-xs backdrop-blur-sm transition-all duration-300 ${
              tx.status === 'pending'
                ? 'bg-[#0d1020]/80 border border-[#ff8020]/20 text-[#ff8020]'
                : tx.status === 'done'
                ? 'bg-[#0d2010]/80 border border-[#30ff60]/20 text-[#30ff60]'
                : 'bg-[#200d0d]/80 border border-[#ff3030]/20 text-[#ff3030]'
            }`}
            style={{ opacity: 1 - i * 0.05 }}
          >
            <div className={`h-1.5 w-1.5 rounded-full ${
              tx.status === 'pending' ? 'bg-[#ff8020] animate-pulse' : tx.status === 'done' ? 'bg-[#30ff60]' : 'bg-[#ff3030]'
            }`} />
            {tx.status === 'pending' ? 'TX...' : tx.status === 'done' ? `TX ${tx.hash ? tx.hash.slice(0, 6) : ''}` : 'FAIL'}
          </div>
        ))}
      </div>
    </div>
  );
}
