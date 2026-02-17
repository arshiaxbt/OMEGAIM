'use client';

import { useRef, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import Scene from './game/Scene';
import Targets from './game/Targets';
import type { TargetsHandle } from './game/Targets';
import ShootingSystem from './game/ShootingSystem';
import Effects from './game/Effects';
import type { EffectsHandle } from './game/Effects';
import HUD from './game/HUD';
import { PLAYER_Y, HIT_MARKER_DURATION, MUZZLE_FLASH_DURATION } from './game/constants';

interface GameProps {
  onShoot: (hit: boolean) => void;
  txList: { id: number; status: 'pending' | 'done' | 'fail'; hash?: string }[];
}

export default function Game({ onShoot, txList }: GameProps) {
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [started, setStarted] = useState(false);
  const [showHitMarker, setShowHitMarker] = useState(false);
  const [showMuzzleFlash, setShowMuzzleFlash] = useState(false);

  const targetsRef = useRef<TargetsHandle>(null);
  const effectsRef = useRef<EffectsHandle | null>(null);
  const hitMarkerTimer = useRef<ReturnType<typeof setTimeout>>();
  const muzzleTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleStart = useCallback(() => {
    setStarted(true);
  }, []);

  const handleShoot = useCallback(
    (hit: boolean, hitPosition?: THREE.Vector3) => {
      setShots((s) => s + 1);

      // Muzzle flash
      setShowMuzzleFlash(true);
      clearTimeout(muzzleTimer.current);
      muzzleTimer.current = setTimeout(() => setShowMuzzleFlash(false), MUZZLE_FLASH_DURATION);

      if (hit) {
        setScore((s) => s + 1);
        setStreak((s) => {
          const ns = s + 1;
          setBestStreak((b) => Math.max(b, ns));
          return ns;
        });

        // Hit marker
        setShowHitMarker(true);
        clearTimeout(hitMarkerTimer.current);
        hitMarkerTimer.current = setTimeout(() => setShowHitMarker(false), HIT_MARKER_DURATION);

        // Spawn particles
        if (hitPosition && effectsRef.current) {
          effectsRef.current.spawnHitParticles(hitPosition);
        }
      } else {
        setStreak(0);
      }

      onShoot(hit);
    },
    [onShoot]
  );

  return (
    <div className="relative h-screen w-screen bg-[#090b0f]">
      <Canvas
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
          gl.toneMappingExposure = 1.2;
        }}
      >
        <Scene />
        <Targets ref={targetsRef} started={started} />
        <ShootingSystem
          started={started}
          onStart={handleStart}
          onShoot={handleShoot}
          targetsRef={targetsRef}
        />
        <Effects effectsRef={effectsRef} />
      </Canvas>

      <HUD
        started={started}
        score={score}
        shots={shots}
        streak={streak}
        bestStreak={bestStreak}
        showHitMarker={showHitMarker}
        showMuzzleFlash={showMuzzleFlash}
        txList={txList}
      />
    </div>
  );
}
