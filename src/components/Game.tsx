'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface Target {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  hit: boolean;
}

function generateTarget(id: number): Target {
  return {
    id,
    x: Math.random() * 80 + 10,
    y: Math.random() * 60 + 10,
    size: 20 + Math.random() * 25,
    speedX: (Math.random() - 0.5) * 4,
    speedY: (Math.random() - 0.5) * 3,
    hit: false,
  };
}

interface GameProps {
  onShoot: (hit: boolean) => void;
  isPending: boolean;
}

export default function Game({ onShoot, isPending }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetsRef = useRef<Target[]>(Array.from({ length: 6 }, (_, i) => generateTarget(i)));
  const nextIdRef = useRef(6);
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);
  const [streak, setStreak] = useState(0);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#1a1a3e';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 3D-like floor gradient
    const floorGrad = ctx.createLinearGradient(0, h * 0.6, 0, h);
    floorGrad.addColorStop(0, '#0f1a2e');
    floorGrad.addColorStop(1, '#1a2a4e');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, h * 0.6, w, h * 0.4);

    // Perspective lines on floor
    ctx.strokeStyle = '#1a3a5e';
    ctx.lineWidth = 1;
    for (let i = 0; i < 15; i++) {
      const x = (w / 2) + (i - 7) * 100;
      ctx.beginPath();
      ctx.moveTo(w / 2, h * 0.6);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let i = 0; i < 5; i++) {
      const y = h * 0.6 + i * (h * 0.4 / 5);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Update and draw targets
    const targets = targetsRef.current;
    for (const t of targets) {
      if (t.hit) continue;

      // Move
      t.x += t.speedX;
      t.y += t.speedY;

      // Bounce
      if (t.x < 5 || t.x > 95) t.speedX *= -1;
      if (t.y < 5 || t.y > 85) t.speedY *= -1;
      t.x = Math.max(5, Math.min(95, t.x));
      t.y = Math.max(5, Math.min(85, t.y));

      const px = (t.x / 100) * w;
      const py = (t.y / 100) * h;
      const r = t.size * (w / 1000);

      // Glow
      const glow = ctx.createRadialGradient(px, py, r * 0.5, px, py, r * 2);
      glow.addColorStop(0, 'rgba(255, 50, 50, 0.3)');
      glow.addColorStop(1, 'rgba(255, 50, 50, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(px, py, r * 2, 0, Math.PI * 2);
      ctx.fill();

      // Target sphere (3D-like)
      const sphereGrad = ctx.createRadialGradient(px - r * 0.3, py - r * 0.3, r * 0.1, px, py, r);
      sphereGrad.addColorStop(0, '#ff6666');
      sphereGrad.addColorStop(0.7, '#cc0000');
      sphereGrad.addColorStop(1, '#660000');
      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();

      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(px - r * 0.25, py - r * 0.25, r * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Ring
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, r + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Crosshair
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mx - 15, my);
    ctx.lineTo(mx - 5, my);
    ctx.moveTo(mx + 5, my);
    ctx.lineTo(mx + 15, my);
    ctx.moveTo(mx, my - 15);
    ctx.lineTo(mx, my - 5);
    ctx.moveTo(mx, my + 5);
    ctx.lineTo(mx, my + 15);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(mx, my, 2, 0, Math.PI * 2);
    ctx.fill();

    animRef.current = requestAnimationFrame(draw);
  }, []);

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

      setShots((s) => s + 1);

      let hitAny = false;
      const targets = targetsRef.current;

      for (const t of targets) {
        if (t.hit) continue;
        const px = (t.x / 100) * w;
        const py = (t.y / 100) * h;
        const r = t.size * (w / 1000);
        const dist = Math.sqrt((clickX - px) ** 2 + (clickY - py) ** 2);

        if (dist <= r + 4) {
          t.hit = true;
          hitAny = true;
          setScore((s) => s + 1);
          setStreak((s) => s + 1);

          // Spawn replacement
          setTimeout(() => {
            targetsRef.current = [
              ...targetsRef.current.filter((tt) => !tt.hit),
              generateTarget(nextIdRef.current++),
            ];
          }, 300);
          break;
        }
      }

      if (!hitAny) {
        setStreak(0);
      }

      onShoot(hitAny);
    },
    [onShoot]
  );

  const accuracy = shots > 0 ? Math.round((score / shots) * 100) : 0;

  return (
    <div className="relative h-screen w-screen bg-black" style={{ cursor: 'none' }}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="block h-full w-full"
      />

      {/* HUD */}
      <div className="pointer-events-none fixed top-12 left-0 right-0 z-40 flex justify-between p-4">
        <div className="space-y-1">
          <div className="text-green-400 font-mono text-lg">
            SCORE: <span className="text-white font-bold">{score}</span>
          </div>
          <div className="text-green-400 font-mono text-sm">
            ACCURACY: <span className="text-white">{accuracy}%</span>
          </div>
        </div>
        <div className="space-y-1 text-right">
          <div className="text-green-400 font-mono text-lg">
            SHOTS: <span className="text-white font-bold">{shots}</span>
          </div>
          <div className="text-green-400 font-mono text-sm">
            STREAK: <span className="text-yellow-400 font-bold">{streak}</span>
          </div>
        </div>
      </div>

      {/* TX Pending */}
      {isPending && (
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded bg-yellow-900/80 px-3 py-2 font-mono text-xs text-yellow-300">
          <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
          TX PENDING ON MEGAETH...
        </div>
      )}
    </div>
  );
}
