import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PARTICLE_COUNT, HIT_EFFECT_DURATION, COLORS } from './constants';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  spawnTime: number;
}

export interface EffectsHandle {
  spawnHitParticles: (position: THREE.Vector3) => void;
}

export default function Effects({ effectsRef }: { effectsRef: React.MutableRefObject<EffectsHandle | null> }) {
  const particlesRef = useRef<Particle[]>([]);
  const meshesRef = useRef<THREE.InstancedMesh | null>(null);
  const dummy = useRef(new THREE.Object3D());
  const MAX_PARTICLES = 100;

  // Expose spawn method
  effectsRef.current = {
    spawnHitParticles: (position: THREE.Vector3) => {
      const now = Date.now();
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particlesRef.current.push({
          position: position.clone(),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 8,
            Math.random() * 6 + 2,
            (Math.random() - 0.5) * 8
          ),
          spawnTime: now,
        });
      }
      // Trim old particles
      if (particlesRef.current.length > MAX_PARTICLES) {
        particlesRef.current = particlesRef.current.slice(-MAX_PARTICLES);
      }
    },
  };

  useFrame((_, delta) => {
    const mesh = meshesRef.current;
    if (!mesh) return;

    const now = Date.now();
    const particles = particlesRef.current;
    const dt = Math.min(delta, 0.05);

    // Remove expired
    for (let i = particles.length - 1; i >= 0; i--) {
      if (now - particles[i].spawnTime > HIT_EFFECT_DURATION) {
        particles.splice(i, 1);
      }
    }

    // Update and render
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (i < particles.length) {
        const p = particles[i];
        p.position.x += p.velocity.x * dt;
        p.position.y += p.velocity.y * dt;
        p.position.z += p.velocity.z * dt;
        p.velocity.y -= 9.8 * dt; // gravity

        const elapsed = now - p.spawnTime;
        const life = 1 - elapsed / HIT_EFFECT_DURATION;
        const scale = life * 0.08;

        dummy.current.position.copy(p.position);
        dummy.current.scale.setScalar(scale);
        dummy.current.updateMatrix();
        mesh.setMatrixAt(i, dummy.current.matrix);
      } else {
        // Hide unused instances
        dummy.current.position.set(0, -100, 0);
        dummy.current.scale.setScalar(0);
        dummy.current.updateMatrix();
        mesh.setMatrixAt(i, dummy.current.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshesRef} args={[undefined, undefined, MAX_PARTICLES]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial
        color={COLORS.hitParticle}
        emissive={COLORS.hitParticle}
        emissiveIntensity={2}
      />
    </instancedMesh>
  );
}
