'use client';

import { useRef, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Scene from './game/Scene';
import Targets from './game/Targets';
import type { TargetsHandle } from './game/Targets';
import ShootingSystem from './game/ShootingSystem';
import Effects from './game/Effects';
import type { EffectsHandle } from './game/Effects';
import GunModel from './game/GunModel';
import HUD from './game/HUD';
import {
  PLAYER_Y,
  HIT_MARKER_DURATION,
  MUZZLE_FLASH_DURATION,
  HEADSHOT_SCORE,
  BODYSHOT_SCORE,
  SHAKE_DECAY,
} from './game/constants';

interface GameProps {
  onShoot: (hit: boolean) => void;
  txList: { id: number; status: 'pending' | 'done' | 'fail'; hash?: string }[];
}

// Camera shake inner component — applies exponential decay shake in useFrame
function CameraShake({ intensity }: { intensity: React.MutableRefObject<number> }) {
  useFrame(({ camera }, delta) => {
    if (intensity.current > 0.001) {
      const dt = Math.min(delta, 0.05);
      const shake = intensity.current;

      camera.position.x += (Math.random() - 0.5) * shake;
      camera.position.y += (Math.random() - 0.5) * shake;

      // Exponential decay
      intensity.current *= Math.exp(-SHAKE_DECAY * dt);
    }
  });
  return null;
}

interface KillFeedEntry {
  id: number;
  text: string;
  isHeadshot: boolean;
  time: number;
}

export default function Game({ onShoot, txList }: GameProps) {
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [started, setStarted] = useState(false);
  const [showHitMarker, setShowHitMarker] = useState(false);
  const [showHeadshotMarker, setShowHeadshotMarker] = useState(false);
  const [showMuzzleFlash, setShowMuzzleFlash] = useState(false);
  const [recoilTrigger, setRecoilTrigger] = useState(0);
  const [crosshairSpread, setCrosshairSpread] = useState(0);
  const [killFeed, setKillFeed] = useState<KillFeedEntry[]>([]);

  const targetsRef = useRef<TargetsHandle>(null);
  const effectsRef = useRef<EffectsHandle | null>(null);
  const shakeIntensity = useRef(0);
  const hitMarkerTimer = useRef<ReturnType<typeof setTimeout>>();
  const headshotMarkerTimer = useRef<ReturnType<typeof setTimeout>>();
  const muzzleTimer = useRef<ReturnType<typeof setTimeout>>();
  const crosshairTimer = useRef<ReturnType<typeof setTimeout>>();
  const killFeedId = useRef(0);

  const handleStart = useCallback(() => {
    setStarted(true);
  }, []);

  const handleCameraShake = useCallback((intensity: number) => {
    shakeIntensity.current = intensity;
  }, []);

  const handleShoot = useCallback(
    (hit: boolean, hitPosition?: THREE.Vector3, isHeadshot?: boolean) => {
      setShots((s) => s + 1);

      // Trigger gun recoil
      setRecoilTrigger((t) => t + 1);

      // Muzzle flash
      setShowMuzzleFlash(true);
      clearTimeout(muzzleTimer.current);
      muzzleTimer.current = setTimeout(() => setShowMuzzleFlash(false), MUZZLE_FLASH_DURATION);

      // Dynamic crosshair expand
      setCrosshairSpread(12);
      clearTimeout(crosshairTimer.current);
      crosshairTimer.current = setTimeout(() => setCrosshairSpread(0), 150);

      // Shell casing + smoke on every shot
      if (effectsRef.current) {
        effectsRef.current.spawnShellCasing();
        effectsRef.current.spawnMuzzleSmoke();
      }

      if (hit) {
        const points = isHeadshot ? HEADSHOT_SCORE : BODYSHOT_SCORE;
        setScore((s) => s + points);
        setStreak((s) => {
          const ns = s + 1;
          setBestStreak((b) => Math.max(b, ns));
          return ns;
        });

        // Hit marker
        if (isHeadshot) {
          setShowHeadshotMarker(true);
          setShowHitMarker(false);
          clearTimeout(headshotMarkerTimer.current);
          headshotMarkerTimer.current = setTimeout(() => setShowHeadshotMarker(false), HIT_MARKER_DURATION);
        } else {
          setShowHitMarker(true);
          setShowHeadshotMarker(false);
          clearTimeout(hitMarkerTimer.current);
          hitMarkerTimer.current = setTimeout(() => setShowHitMarker(false), HIT_MARKER_DURATION);
        }

        // Kill feed
        const feedEntry: KillFeedEntry = {
          id: killFeedId.current++,
          text: isHeadshot ? 'HEADSHOT +10' : 'ELIMINATED +1',
          isHeadshot: !!isHeadshot,
          time: Date.now(),
        };
        setKillFeed((prev) => [...prev.slice(-4), feedEntry]);

        // Spawn hit particles
        if (hitPosition && effectsRef.current) {
          effectsRef.current.spawnHitParticles(hitPosition);
        }
      } else {
        setStreak(0);

        // Wall impact sparks on miss
        if (hitPosition && effectsRef.current) {
          effectsRef.current.spawnWallSparks(hitPosition);
        }
      }

      onShoot(hit);
    },
    [onShoot]
  );

  return (
    <div className="relative h-screen w-screen bg-[#1a1a18]">
      <Canvas
        shadows="soft"
        camera={{
          fov: 75,
          position: [0, PLAYER_Y, 0],
          near: 0.1,
          far: 100,
        }}
        gl={{ antialias: true, alpha: false }}
        style={{ position: 'absolute', inset: 0 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.5;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <Scene />
        <Targets ref={targetsRef} started={started} />
        <ShootingSystem
          started={started}
          onStart={handleStart}
          onShoot={handleShoot}
          targetsRef={targetsRef}
          onCameraShake={handleCameraShake}
        />
        <GunModel recoilTrigger={recoilTrigger} showMuzzleFlash={showMuzzleFlash} />
        <Effects effectsRef={effectsRef} />
        <CameraShake intensity={shakeIntensity} />
      </Canvas>

      <HUD
        started={started}
        score={score}
        shots={shots}
        streak={streak}
        bestStreak={bestStreak}
        showHitMarker={showHitMarker}
        showHeadshotMarker={showHeadshotMarker}
        showMuzzleFlash={showMuzzleFlash}
        crosshairSpread={crosshairSpread}
        killFeed={killFeed}
        txList={txList}
      />
    </div>
  );
}
