'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';

interface Target {
  id: number;
  position: [number, number, number];
  scale: number;
  speed: number;
  direction: THREE.Vector3;
  hit: boolean;
}

function generateTarget(id: number): Target {
  return {
    id,
    position: [
      (Math.random() - 0.5) * 16,
      Math.random() * 6 + 1,
      -(Math.random() * 10 + 5),
    ],
    scale: 0.3 + Math.random() * 0.4,
    speed: 1 + Math.random() * 3,
    direction: new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5),
      0
    ).normalize(),
    hit: false,
  };
}

function TargetSphere({
  target,
  onHit,
}: {
  target: Target;
  onHit: (id: number) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const posRef = useRef(new THREE.Vector3(...target.position));

  useFrame((_, delta) => {
    if (!meshRef.current || target.hit) return;
    const pos = posRef.current;
    pos.add(target.direction.clone().multiplyScalar(target.speed * delta));

    if (pos.x > 10 || pos.x < -10) target.direction.x *= -1;
    if (pos.y > 8 || pos.y < 0.5) target.direction.y *= -1;

    meshRef.current.position.copy(pos);
  });

  if (target.hit) return null;

  return (
    <mesh
      ref={meshRef}
      position={target.position}
      onClick={(e) => {
        e.stopPropagation();
        onHit(target.id);
      }}
    >
      <sphereGeometry args={[target.scale, 16, 16]} />
      <meshStandardMaterial
        color="#ff3333"
        emissive="#ff0000"
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

function Crosshair() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <div className="relative h-8 w-8">
        <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-green-400 opacity-80" />
        <div className="absolute top-1/2 left-0 w-full h-[2px] -translate-y-1/2 bg-green-400 opacity-80" />
        <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-400" />
      </div>
    </div>
  );
}

function Arena() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -5]}>
        <planeGeometry args={[30, 25]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, 5, -17.5]}>
        <planeGeometry args={[30, 10]} />
        <meshStandardMaterial color="#16213e" />
      </mesh>
      {/* Left wall */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-15, 5, -5]}>
        <planeGeometry args={[25, 10]} />
        <meshStandardMaterial color="#0f3460" />
      </mesh>
      {/* Right wall */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[15, 5, -5]}>
        <planeGeometry args={[25, 10]} />
        <meshStandardMaterial color="#0f3460" />
      </mesh>
    </group>
  );
}

function PointerLockCamera() {
  const { camera, gl } = useThree();
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const sensitivity = 0.002;

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== gl.domElement) return;
      euler.current.y -= event.movementX * sensitivity;
      euler.current.x -= event.movementY * sensitivity;
      euler.current.x = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, euler.current.x)
      );
      camera.quaternion.setFromEuler(euler.current);
    };

    document.addEventListener('mousemove', onMouseMove);
    return () => document.removeEventListener('mousemove', onMouseMove);
  }, [camera, gl.domElement]);

  return null;
}

function ShootHandler({
  onShoot,
}: {
  onShoot: (hit: boolean) => void;
}) {
  const { camera, raycaster, scene, gl } = useThree();

  useEffect(() => {
    const onClick = () => {
      if (document.pointerLockElement !== gl.domElement) {
        gl.domElement.requestPointerLock();
        return;
      }
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      const hitTarget = intersects.find(
        (i) =>
          i.object instanceof THREE.Mesh &&
          i.object.geometry instanceof THREE.SphereGeometry
      );
      onShoot(!!hitTarget);
    };

    gl.domElement.addEventListener('click', onClick);
    return () => gl.domElement.removeEventListener('click', onClick);
  }, [camera, raycaster, scene, gl, onShoot]);

  return null;
}

interface GameSceneProps {
  onShoot: (hit: boolean) => void;
  targets: Target[];
  onHitTarget: (id: number) => void;
}

function GameScene({ onShoot, targets, onHitTarget }: GameSceneProps) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <pointLight position={[0, 5, -5]} intensity={0.5} color="#00ff88" />
      <PointerLockCamera />
      <ShootHandler onShoot={onShoot} />
      <Arena />
      {targets.map((t) => (
        <TargetSphere key={t.id} target={t} onHit={onHitTarget} />
      ))}
    </>
  );
}

interface GameProps {
  onShoot: (hit: boolean) => void;
  isPending: boolean;
}

export default function Game({ onShoot, isPending }: GameProps) {
  const [targets, setTargets] = useState<Target[]>(() =>
    Array.from({ length: 6 }, (_, i) => generateTarget(i))
  );
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);
  const [streak, setStreak] = useState(0);
  const nextId = useRef(6);

  const handleHitTarget = useCallback((id: number) => {
    setTargets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, hit: true } : t))
    );
    setScore((s) => s + 1);
    setStreak((s) => s + 1);
    // Spawn a new target
    setTimeout(() => {
      setTargets((prev) => {
        const alive = prev.filter((t) => !t.hit);
        return [...alive, generateTarget(nextId.current++)];
      });
    }, 300);
  }, []);

  const handleShoot = useCallback(
    (hit: boolean) => {
      setShots((s) => s + 1);
      if (!hit) setStreak(0);
      onShoot(hit);
    },
    [onShoot]
  );

  const accuracy = shots > 0 ? Math.round((score / shots) * 100) : 0;

  return (
    <div className="relative h-screen w-screen bg-black">
      <Crosshair />

      {/* HUD */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 z-40 flex justify-between p-4">
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

      {/* TX Pending indicator */}
      {isPending && (
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded bg-yellow-900/80 px-3 py-2 font-mono text-xs text-yellow-300">
          <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
          TX PENDING ON MEGAETH...
        </div>
      )}

      {/* Click to start overlay */}
      <div
        id="start-overlay"
        className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center"
      >
        <div className="text-center font-mono text-green-400 opacity-60">
          <p className="text-lg">CLICK TO LOCK CURSOR & SHOOT</p>
          <p className="text-sm mt-1">ESC to unlock</p>
        </div>
      </div>

      <Canvas
        camera={{ position: [0, 3, 5], fov: 70 }}
        style={{ height: '100vh', width: '100vw' }}
      >
        <GameScene
          onShoot={handleShoot}
          targets={targets}
          onHitTarget={handleHitTarget}
        />
      </Canvas>
    </div>
  );
}
