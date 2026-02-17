import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  PARTICLE_COUNT,
  HIT_EFFECT_DURATION,
  SHELL_CASING_LIFETIME,
  WALL_SPARK_LIFETIME,
  SMOKE_LIFETIME,
  COLORS,
} from './constants';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  spawnTime: number;
  lifetime: number;
}

export interface EffectsHandle {
  spawnHitParticles: (position: THREE.Vector3) => void;
  spawnWallSparks: (position: THREE.Vector3) => void;
  spawnShellCasing: () => void;
  spawnMuzzleSmoke: () => void;
}

const MAX_HIT = 100;
const MAX_WALL = 50;
const MAX_SHELL = 30;
const MAX_SMOKE = 20;

export default function Effects({ effectsRef }: { effectsRef: React.MutableRefObject<EffectsHandle | null> }) {
  const hitParticles = useRef<Particle[]>([]);
  const wallSparks = useRef<Particle[]>([]);
  const shellCasings = useRef<Particle[]>([]);
  const smokeParticles = useRef<Particle[]>([]);

  const hitMeshRef = useRef<THREE.InstancedMesh>(null);
  const wallMeshRef = useRef<THREE.InstancedMesh>(null);
  const shellMeshRef = useRef<THREE.InstancedMesh>(null);
  const smokeMeshRef = useRef<THREE.InstancedMesh>(null);

  const dummy = useRef(new THREE.Object3D());
  const cameraRef = useRef<THREE.Camera | null>(null);

  effectsRef.current = {
    spawnHitParticles: (position: THREE.Vector3) => {
      const now = Date.now();
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        hitParticles.current.push({
          position: position.clone(),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            Math.random() * 8 + 2,
            (Math.random() - 0.5) * 10
          ),
          spawnTime: now,
          lifetime: HIT_EFFECT_DURATION,
        });
      }
      if (hitParticles.current.length > MAX_HIT) {
        hitParticles.current = hitParticles.current.slice(-MAX_HIT);
      }
    },

    spawnWallSparks: (position: THREE.Vector3) => {
      const now = Date.now();
      for (let i = 0; i < 8; i++) {
        wallSparks.current.push({
          position: position.clone(),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 6,
            Math.random() * 4 + 1,
            (Math.random() - 0.5) * 6
          ),
          spawnTime: now,
          lifetime: WALL_SPARK_LIFETIME,
        });
      }
      if (wallSparks.current.length > MAX_WALL) {
        wallSparks.current = wallSparks.current.slice(-MAX_WALL);
      }
    },

    spawnShellCasing: () => {
      if (!cameraRef.current) return;
      const cam = cameraRef.current;
      const pos = cam.position.clone();
      // Offset to right and slightly down from camera
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
      pos.add(right.multiplyScalar(0.3));
      pos.add(up.multiplyScalar(-0.1));

      shellCasings.current.push({
        position: pos,
        velocity: new THREE.Vector3(
          right.x * 3 + (Math.random() - 0.5),
          2 + Math.random(),
          right.z * 3 + (Math.random() - 0.5)
        ),
        spawnTime: Date.now(),
        lifetime: SHELL_CASING_LIFETIME,
      });
      if (shellCasings.current.length > MAX_SHELL) {
        shellCasings.current = shellCasings.current.slice(-MAX_SHELL);
      }
    },

    spawnMuzzleSmoke: () => {
      if (!cameraRef.current) return;
      const cam = cameraRef.current;
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
      const pos = cam.position.clone().add(forward.multiplyScalar(0.5));

      for (let i = 0; i < 3; i++) {
        smokeParticles.current.push({
          position: pos.clone().add(new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1
          )),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            0.3 + Math.random() * 0.3,
            (Math.random() - 0.5) * 0.3
          ),
          spawnTime: Date.now(),
          lifetime: SMOKE_LIFETIME,
        });
      }
      if (smokeParticles.current.length > MAX_SMOKE) {
        smokeParticles.current = smokeParticles.current.slice(-MAX_SMOKE);
      }
    },
  };

  function updateSystem(
    particles: Particle[],
    mesh: THREE.InstancedMesh | null,
    maxCount: number,
    dt: number,
    now: number,
    gravity: boolean,
    baseScale: number,
  ) {
    if (!mesh) return;

    // Remove expired
    for (let i = particles.length - 1; i >= 0; i--) {
      if (now - particles[i].spawnTime > particles[i].lifetime) {
        particles.splice(i, 1);
      }
    }

    for (let i = 0; i < maxCount; i++) {
      if (i < particles.length) {
        const p = particles[i];
        p.position.x += p.velocity.x * dt;
        p.position.y += p.velocity.y * dt;
        p.position.z += p.velocity.z * dt;
        if (gravity) {
          p.velocity.y -= 9.8 * dt;
        }

        const elapsed = now - p.spawnTime;
        const life = 1 - elapsed / p.lifetime;
        const scale = life * baseScale;

        dummy.current.position.copy(p.position);
        dummy.current.scale.setScalar(Math.max(scale, 0.001));
        dummy.current.updateMatrix();
        mesh.setMatrixAt(i, dummy.current.matrix);
      } else {
        dummy.current.position.set(0, -100, 0);
        dummy.current.scale.setScalar(0);
        dummy.current.updateMatrix();
        mesh.setMatrixAt(i, dummy.current.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  useFrame(({ camera }, delta) => {
    cameraRef.current = camera;
    const dt = Math.min(delta, 0.05);
    const now = Date.now();

    updateSystem(hitParticles.current, hitMeshRef.current, MAX_HIT, dt, now, true, 0.08);
    updateSystem(wallSparks.current, wallMeshRef.current, MAX_WALL, dt, now, true, 0.05);
    updateSystem(shellCasings.current, shellMeshRef.current, MAX_SHELL, dt, now, true, 0.03);
    updateSystem(smokeParticles.current, smokeMeshRef.current, MAX_SMOKE, dt, now, false, 0.12);
  });

  return (
    <>
      {/* Hit particles — orange/red */}
      <instancedMesh ref={hitMeshRef} args={[undefined, undefined, MAX_HIT]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial
          color={COLORS.hitParticle}
          emissive={COLORS.hitParticle}
          emissiveIntensity={3}
        />
      </instancedMesh>

      {/* Wall sparks — yellow */}
      <instancedMesh ref={wallMeshRef} args={[undefined, undefined, MAX_WALL]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshStandardMaterial
          color={COLORS.wallSpark}
          emissive={COLORS.wallSpark}
          emissiveIntensity={5}
        />
      </instancedMesh>

      {/* Shell casings — brass cylinders */}
      <instancedMesh ref={shellMeshRef} args={[undefined, undefined, MAX_SHELL]}>
        <cylinderGeometry args={[0.3, 0.3, 1.5, 6]} />
        <meshStandardMaterial
          color={COLORS.shellCasing}
          metalness={0.9}
          roughness={0.2}
        />
      </instancedMesh>

      {/* Muzzle smoke — gray transparent */}
      <instancedMesh ref={smokeMeshRef} args={[undefined, undefined, MAX_SMOKE]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshStandardMaterial
          color={COLORS.muzzleSmoke}
          transparent
          opacity={0.3}
        />
      </instancedMesh>
    </>
  );
}
