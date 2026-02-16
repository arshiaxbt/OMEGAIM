'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface Target {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  hit: boolean;
  hitTime: number;
  spawnTime: number;
  speedX: number;
  speedY: number;
}

// Screen area bounds (percentage of canvas) for the central target screen
const SCREEN_LEFT = 15;
const SCREEN_RIGHT = 85;
const SCREEN_TOP = 10;
const SCREEN_BOTTOM = 75;

type SpawnPattern = 'grid' | 'horizontal' | 'vertical' | 'cluster' | 'random';

function getPattern(): SpawnPattern {
  const patterns: SpawnPattern[] = ['grid', 'horizontal', 'vertical', 'cluster', 'random'];
  return patterns[Math.floor(Math.random() * patterns.length)];
}

function spawnWave(nextId: { current: number }): Target[] {
  const pattern = getPattern();
  const targets: Target[] = [];
  const now = Date.now();

  switch (pattern) {
    case 'grid': {
      const cols = 3 + Math.floor(Math.random() * 3);
      const rows = 2 + Math.floor(Math.random() * 2);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          targets.push({
            id: nextId.current++,
            x: SCREEN_LEFT + 8 + c * ((SCREEN_RIGHT - SCREEN_LEFT - 16) / (cols - 1)),
            y: SCREEN_TOP + 10 + r * ((SCREEN_BOTTOM - SCREEN_TOP - 20) / (rows - 1)),
            w: 3 + Math.random() * 1.5,
            h: 4 + Math.random() * 2,
            hit: false,
            hitTime: 0,
            spawnTime: now + (r * cols + c) * 30,
            speedX: 0,
            speedY: 0,
          });
        }
      }
      break;
    }
    case 'horizontal': {
      const count = 5 + Math.floor(Math.random() * 4);
      const rowY = SCREEN_TOP + 10 + Math.random() * (SCREEN_BOTTOM - SCREEN_TOP - 25);
      for (let i = 0; i < count; i++) {
        targets.push({
          id: nextId.current++,
          x: SCREEN_LEFT + 6 + i * ((SCREEN_RIGHT - SCREEN_LEFT - 12) / (count - 1)),
          y: rowY,
          w: 3 + Math.random(),
          h: 4.5 + Math.random(),
          hit: false,
          hitTime: 0,
          spawnTime: now + i * 40,
          speedX: 0,
          speedY: 0,
        });
      }
      break;
    }
    case 'vertical': {
      const count = 4 + Math.floor(Math.random() * 3);
      const colX = SCREEN_LEFT + 10 + Math.random() * (SCREEN_RIGHT - SCREEN_LEFT - 25);
      for (let i = 0; i < count; i++) {
        targets.push({
          id: nextId.current++,
          x: colX,
          y: SCREEN_TOP + 8 + i * ((SCREEN_BOTTOM - SCREEN_TOP - 16) / (count - 1)),
          w: 3 + Math.random(),
          h: 4.5 + Math.random(),
          hit: false,
          hitTime: 0,
          spawnTime: now + i * 50,
          speedX: 0,
          speedY: 0,
        });
      }
      break;
    }
    case 'cluster': {
      const count = 5 + Math.floor(Math.random() * 4);
      const cx = SCREEN_LEFT + 15 + Math.random() * (SCREEN_RIGHT - SCREEN_LEFT - 30);
      const cy = SCREEN_TOP + 15 + Math.random() * (SCREEN_BOTTOM - SCREEN_TOP - 30);
      for (let i = 0; i < count; i++) {
        targets.push({
          id: nextId.current++,
          x: cx + (Math.random() - 0.5) * 25,
          y: cy + (Math.random() - 0.5) * 20,
          w: 2.5 + Math.random() * 1.5,
          h: 3.5 + Math.random() * 2,
          hit: false,
          hitTime: 0,
          spawnTime: now + i * 25,
          speedX: (Math.random() - 0.5) * 0.8,
          speedY: (Math.random() - 0.5) * 0.6,
        });
      }
      break;
    }
    default: {
      const count = 6 + Math.floor(Math.random() * 5);
      for (let i = 0; i < count; i++) {
        targets.push({
          id: nextId.current++,
          x: SCREEN_LEFT + 5 + Math.random() * (SCREEN_RIGHT - SCREEN_LEFT - 10),
          y: SCREEN_TOP + 5 + Math.random() * (SCREEN_BOTTOM - SCREEN_TOP - 10),
          w: 2.5 + Math.random() * 2,
          h: 3.5 + Math.random() * 2.5,
          hit: false,
          hitTime: 0,
          spawnTime: now + i * 35,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.4,
        });
      }
      break;
    }
  }

  return targets;
}

interface HitEffect {
  x: number;
  y: number;
  time: number;
}

interface GameProps {
  onShoot: (hit: boolean) => void;
  isPending: boolean;
}

export default function Game({ onShoot, isPending }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextIdRef = useRef(0);
  const targetsRef = useRef<Target[]>([]);
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [started, setStarted] = useState(false);
  const [showGo, setShowGo] = useState(false);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const hitEffectsRef = useRef<HitEffect[]>([]);
  const timeRef = useRef(0);
  const waveTimer = useRef(0);

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
    // Dark metallic floor/walls
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0a0c10');
    bgGrad.addColorStop(0.3, '#0d1017');
    bgGrad.addColorStop(0.7, '#0f1219');
    bgGrad.addColorStop(1, '#0a0c10');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Wall panel lines (subtle metallic tiling)
    ctx.strokeStyle = '#1a1e2a';
    ctx.lineWidth = 1;
    const tileSize = 80;
    for (let x = 0; x < w; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Blue neon edge glow - top
    const topGlow = ctx.createLinearGradient(0, 0, 0, 8);
    topGlow.addColorStop(0, 'rgba(60, 130, 255, 0.4)');
    topGlow.addColorStop(1, 'rgba(60, 130, 255, 0)');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, w, 8);

    // Blue neon edge glow - bottom
    const botGlow = ctx.createLinearGradient(0, h - 8, 0, h);
    botGlow.addColorStop(0, 'rgba(60, 130, 255, 0)');
    botGlow.addColorStop(1, 'rgba(60, 130, 255, 0.3)');
    ctx.fillStyle = botGlow;
    ctx.fillRect(0, h - 8, w, 8);

    // Subtle blue neon horizontal lines on walls
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = '#3c82ff';
    ctx.lineWidth = 1;
    for (let y = tileSize; y < h; y += tileSize * 2) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // === CENTRAL TARGET SCREEN ===
    const sLeft = (SCREEN_LEFT / 100) * w;
    const sRight = (SCREEN_RIGHT / 100) * w;
    const sTop = (SCREEN_TOP / 100) * h;
    const sBottom = (SCREEN_BOTTOM / 100) * h;
    const sWidth = sRight - sLeft;
    const sHeight = sBottom - sTop;

    // Screen background - dark checkered grid
    ctx.fillStyle = '#0c0e14';
    ctx.fillRect(sLeft, sTop, sWidth, sHeight);

    // Checkered pattern
    const gridSize = 40;
    for (let gx = 0; gx < sWidth; gx += gridSize) {
      for (let gy = 0; gy < sHeight; gy += gridSize) {
        const isAlt = ((Math.floor(gx / gridSize) + Math.floor(gy / gridSize)) % 2) === 0;
        ctx.fillStyle = isAlt ? '#0e1018' : '#11141e';
        ctx.fillRect(sLeft + gx, sTop + gy, gridSize, gridSize);
      }
    }

    // Screen grid lines (subtle)
    ctx.strokeStyle = '#1a1f30';
    ctx.lineWidth = 0.5;
    for (let gx = 0; gx <= sWidth; gx += gridSize) {
      ctx.beginPath();
      ctx.moveTo(sLeft + gx, sTop);
      ctx.lineTo(sLeft + gx, sBottom);
      ctx.stroke();
    }
    for (let gy = 0; gy <= sHeight; gy += gridSize) {
      ctx.beginPath();
      ctx.moveTo(sLeft, sTop + gy);
      ctx.lineTo(sRight, sTop + gy);
      ctx.stroke();
    }

    // Glowing blue border frame
    ctx.strokeStyle = '#3c82ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#3c82ff';
    ctx.shadowBlur = 12;
    ctx.strokeRect(sLeft, sTop, sWidth, sHeight);
    ctx.shadowBlur = 0;

    // Corner accents
    const cornerLen = 20;
    ctx.strokeStyle = '#6aa3ff';
    ctx.lineWidth = 3;
    // TL
    ctx.beginPath();
    ctx.moveTo(sLeft, sTop + cornerLen);
    ctx.lineTo(sLeft, sTop);
    ctx.lineTo(sLeft + cornerLen, sTop);
    ctx.stroke();
    // TR
    ctx.beginPath();
    ctx.moveTo(sRight - cornerLen, sTop);
    ctx.lineTo(sRight, sTop);
    ctx.lineTo(sRight, sTop + cornerLen);
    ctx.stroke();
    // BL
    ctx.beginPath();
    ctx.moveTo(sLeft, sBottom - cornerLen);
    ctx.lineTo(sLeft, sBottom);
    ctx.lineTo(sLeft + cornerLen, sBottom);
    ctx.stroke();
    // BR
    ctx.beginPath();
    ctx.moveTo(sRight - cornerLen, sBottom);
    ctx.lineTo(sRight, sBottom);
    ctx.lineTo(sRight, sBottom - cornerLen);
    ctx.stroke();

    // === TARGETS ===
    if (started) {
      const targets = targetsRef.current;
      const aliveCount = targets.filter(t => !t.hit).length;

      // Auto-spawn new wave when all cleared
      if (aliveCount === 0 && now - waveTimer.current > 400) {
        targetsRef.current = spawnWave(nextIdRef);
        waveTimer.current = now;
      }

      for (const t of targets) {
        // Move targets
        if (!t.hit && t.speedX !== 0) {
          t.x += t.speedX;
          t.y += t.speedY;
          if (t.x < SCREEN_LEFT + 3 || t.x > SCREEN_RIGHT - 3) t.speedX *= -1;
          if (t.y < SCREEN_TOP + 3 || t.y > SCREEN_BOTTOM - 3) t.speedY *= -1;
        }

        const px = (t.x / 100) * w;
        const py = (t.y / 100) * h;
        const tw = (t.w / 100) * w;
        const th = (t.h / 100) * h;

        if (t.hit) {
          // Hit flash effect
          const elapsed = now - t.hitTime;
          if (elapsed > 300) continue;
          const progress = elapsed / 300;
          ctx.globalAlpha = 1 - progress;

          // Orange flash
          const flashGrad = ctx.createRadialGradient(px, py, 0, px, py, tw * 2);
          flashGrad.addColorStop(0, 'rgba(255, 160, 40, 0.9)');
          flashGrad.addColorStop(0.5, 'rgba(255, 100, 20, 0.4)');
          flashGrad.addColorStop(1, 'rgba(255, 60, 10, 0)');
          ctx.fillStyle = flashGrad;
          ctx.beginPath();
          ctx.arc(px, py, tw * 2 * (1 + progress), 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = 1;
          continue;
        }

        // Only show if spawned
        if (now < t.spawnTime) continue;

        // Spawn-in animation
        const spawnElapsed = now - t.spawnTime;
        const spawnProgress = Math.min(1, spawnElapsed / 150);

        ctx.globalAlpha = spawnProgress;

        // Orange glow behind target
        const glow = ctx.createRadialGradient(px, py, tw * 0.3, px, py, tw * 1.5);
        glow.addColorStop(0, 'rgba(255, 140, 30, 0.25)');
        glow.addColorStop(1, 'rgba(255, 100, 20, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, tw * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Target body - orange rectangle with rounded corners
        const halfW = tw / 2 * spawnProgress;
        const halfH = th / 2 * spawnProgress;
        const borderR = 3;

        // Main body
        const bodyGrad = ctx.createLinearGradient(px - halfW, py - halfH, px + halfW, py + halfH);
        bodyGrad.addColorStop(0, '#ff9020');
        bodyGrad.addColorStop(0.5, '#ff7010');
        bodyGrad.addColorStop(1, '#e05500');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(px - halfW, py - halfH, halfW * 2, halfH * 2, borderR);
        ctx.fill();

        // Highlight strip on top
        ctx.fillStyle = 'rgba(255, 200, 120, 0.35)';
        ctx.fillRect(px - halfW + 2, py - halfH + 1, halfW * 2 - 4, halfH * 0.35);

        // "Eye" dots (bot-like)
        if (halfW > 8) {
          ctx.fillStyle = '#1a0800';
          const eyeY = py - halfH * 0.15;
          const eyeSize = Math.max(2, halfW * 0.12);
          ctx.beginPath();
          ctx.arc(px - halfW * 0.3, eyeY, eyeSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(px + halfW * 0.3, eyeY, eyeSize, 0, Math.PI * 2);
          ctx.fill();
        }

        // Subtle border
        ctx.strokeStyle = '#ffb050';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(px - halfW, py - halfH, halfW * 2, halfH * 2, borderR);
        ctx.stroke();

        // Pulse ring
        const pulse = Math.sin(time * 4 + t.id) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(255, 140, 30, ${0.1 + pulse * 0.15})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(px - halfW - 3, py - halfH - 3, halfW * 2 + 6, halfH * 2 + 6, borderR + 2);
        ctx.stroke();

        ctx.globalAlpha = 1;
      }
    }

    // === HIT EFFECTS (sparks) ===
    const effects = hitEffectsRef.current;
    for (let i = effects.length - 1; i >= 0; i--) {
      const e = effects[i];
      const elapsed = now - e.time;
      if (elapsed > 500) {
        effects.splice(i, 1);
        continue;
      }
      const progress = elapsed / 500;
      // Spark particles
      ctx.globalAlpha = 1 - progress;
      for (let j = 0; j < 6; j++) {
        const angle = (j / 6) * Math.PI * 2 + progress * 2;
        const dist = progress * 30;
        const sx = e.x + Math.cos(angle) * dist;
        const sy = e.y + Math.sin(angle) * dist;
        ctx.fillStyle = j % 2 === 0 ? '#ffa020' : '#ffcc60';
        ctx.beginPath();
        ctx.arc(sx, sy, 2 * (1 - progress), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // === "SHOOT TO START" or "GO!" ===
    if (!started) {
      const cx = w / 2;
      const cy = h * 0.42;

      // Faint circular reticle
      ctx.strokeStyle = 'rgba(100, 160, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 50, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 35, 0, Math.PI * 2);
      ctx.stroke();

      // Cross in reticle
      ctx.strokeStyle = 'rgba(100, 160, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(cx - 55, cy);
      ctx.lineTo(cx - 20, cy);
      ctx.moveTo(cx + 20, cy);
      ctx.lineTo(cx + 55, cy);
      ctx.moveTo(cx, cy - 55);
      ctx.lineTo(cx, cy - 20);
      ctx.moveTo(cx, cy + 20);
      ctx.lineTo(cx, cy + 55);
      ctx.stroke();

      // "Shoot to start" text
      const pulseAlpha = 0.5 + Math.sin(time * 2) * 0.3;
      ctx.globalAlpha = pulseAlpha;
      ctx.fillStyle = '#6aa3ff';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SHOOT TO START', cx, cy + 80);
      ctx.globalAlpha = 1;
    }

    // === "GO!" overlay ===
    if (showGo) {
      ctx.fillStyle = '#ff8800';
      ctx.font = 'bold 72px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 20;
      ctx.fillText('GO!', w / 2, h * 0.42);
      ctx.shadowBlur = 0;
    }

    // === FIRST PERSON PISTOL ===
    const gunX = w / 2 + 80;
    const gunY = h - 20;

    // Gun body
    ctx.fillStyle = '#1a1c22';
    ctx.beginPath();
    ctx.moveTo(gunX - 30, gunY);
    ctx.lineTo(gunX - 25, gunY - 65);
    ctx.lineTo(gunX + 20, gunY - 70);
    ctx.lineTo(gunX + 25, gunY - 60);
    ctx.lineTo(gunX + 22, gunY - 30);
    ctx.lineTo(gunX + 10, gunY);
    ctx.closePath();
    ctx.fill();

    // Barrel
    ctx.fillStyle = '#22252e';
    ctx.fillRect(gunX - 8, gunY - 100, 18, 35);

    // Orange accent lights
    ctx.fillStyle = '#ff7020';
    ctx.shadowColor = '#ff7020';
    ctx.shadowBlur = 6;
    ctx.fillRect(gunX - 5, gunY - 55, 12, 2);
    ctx.fillRect(gunX - 3, gunY - 48, 8, 2);
    ctx.fillRect(gunX + 15, gunY - 62, 3, 15);
    ctx.shadowBlur = 0;

    // Grip details
    ctx.strokeStyle = '#2a2d38';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(gunX - 25 + i * 2, gunY - 25 + i * 5);
      ctx.lineTo(gunX + 5 + i * 2, gunY - 25 + i * 5);
      ctx.stroke();
    }

    // === CROSSHAIR - simple green + ===
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;

    ctx.strokeStyle = '#30ff60';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mx - 10, my);
    ctx.lineTo(mx - 3, my);
    ctx.moveTo(mx + 3, my);
    ctx.lineTo(mx + 10, my);
    ctx.moveTo(mx, my - 10);
    ctx.lineTo(mx, my - 3);
    ctx.moveTo(mx, my + 3);
    ctx.lineTo(mx, my + 10);
    ctx.stroke();

    // === FLOOR AREA (below target screen) ===
    const floorY = sBottom + 15;
    const floorGrad = ctx.createLinearGradient(0, floorY, 0, h);
    floorGrad.addColorStop(0, '#0e1118');
    floorGrad.addColorStop(1, '#090b0f');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, floorY, w, h - floorY);

    // Floor grid (perspective)
    ctx.strokeStyle = '#1a1e28';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 15; i++) {
      const fx = (w / 2) + (i - 7) * 120;
      ctx.beginPath();
      ctx.moveTo(w / 2, floorY);
      ctx.lineTo(fx, h);
      ctx.stroke();
    }
    for (let i = 0; i < 4; i++) {
      const fy = floorY + i * ((h - floorY) / 4);
      ctx.beginPath();
      ctx.moveTo(0, fy);
      ctx.lineTo(w, fy);
      ctx.stroke();
    }

    animRef.current = requestAnimationFrame(draw);
  }, [started, showGo]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMouseMove);

    animRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animRef.current);
    };
  }, [draw]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const w = canvas.width;
      const h = canvas.height;
      const clickX = e.clientX;
      const clickY = e.clientY;

      // Start the game on first click
      if (!started) {
        setStarted(true);
        setShowGo(true);
        setTimeout(() => setShowGo(false), 600);
        targetsRef.current = spawnWave(nextIdRef);
        waveTimer.current = Date.now();
        return;
      }

      setShots((s) => s + 1);

      let hitAny = false;
      const targets = targetsRef.current;
      const now = Date.now();

      for (const t of targets) {
        if (t.hit || now < t.spawnTime) continue;

        const px = (t.x / 100) * w;
        const py = (t.y / 100) * h;
        const tw = (t.w / 100) * w;
        const th = (t.h / 100) * h;

        if (
          clickX >= px - tw / 2 - 4 &&
          clickX <= px + tw / 2 + 4 &&
          clickY >= py - th / 2 - 4 &&
          clickY <= py + th / 2 + 4
        ) {
          t.hit = true;
          t.hitTime = now;
          hitAny = true;
          setScore((s) => s + 1);
          setStreak((s) => {
            const newStreak = s + 1;
            setBestStreak((b) => Math.max(b, newStreak));
            return newStreak;
          });
          hitEffectsRef.current.push({ x: px, y: py, time: now });
          break;
        }
      }

      if (!hitAny) {
        setStreak(0);
      }

      onShoot(hitAny);
    },
    [onShoot, started]
  );

  const accuracy = shots > 0 ? Math.round((score / shots) * 100) : 0;

  return (
    <div className="relative h-screen w-screen bg-[#090b0f]" style={{ cursor: 'none' }}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="block h-full w-full"
      />

      {/* Score - bottom center (large) */}
      {started && (
        <div className="pointer-events-none fixed bottom-16 left-0 right-0 z-40 flex justify-center">
          <div className="text-center">
            <div className="text-white font-mono text-5xl font-bold tabular-nums" style={{ textShadow: '0 0 20px rgba(255,140,30,0.3)' }}>
              {score}
            </div>
          </div>
        </div>
      )}

      {/* Minimal side stats */}
      {started && (
        <>
          <div className="pointer-events-none fixed bottom-6 left-6 z-40 flex items-center gap-4">
            <div className="text-[#6a7aaa] font-mono text-xs">
              ACC <span className="text-[#8a9acc]">{accuracy}%</span>
            </div>
            <div className="text-[#6a5aaa] font-mono text-xs">
              STREAK <span className="text-[#9a8acc]">{streak}</span>
            </div>
            {bestStreak > 0 && (
              <div className="text-[#5a6aaa] font-mono text-xs">
                BEST <span className="text-[#8a9acc]">{bestStreak}</span>
              </div>
            )}
          </div>
          <div className="pointer-events-none fixed bottom-6 right-6 z-40">
            <div className="text-[#6a7aaa] font-mono text-xs">
              SHOTS <span className="text-[#8a9acc]">{shots}</span>
            </div>
          </div>
        </>
      )}

      {/* TX indicator */}
      {isPending && (
        <div className="fixed top-14 right-4 z-40 flex items-center gap-2 rounded bg-[#0d1020]/80 backdrop-blur-sm border border-[#3c82ff]/20 px-3 py-1.5 font-mono text-xs text-[#3c82ff]">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3c82ff]" />
          TX
        </div>
      )}
    </div>
  );
}
