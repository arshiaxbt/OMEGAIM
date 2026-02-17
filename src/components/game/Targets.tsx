import { useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  TARGET_ZONE,
  WAVE_MIN,
  WAVE_MAX,
  WAVE_DELAY,
  TARGET_SPEED_MIN,
  TARGET_SPEED_MAX,
  COLORS,
} from './constants';

interface Target {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  alive: boolean;
  hitTime: number;
  type: 'orange' | 'cyan';
}

export interface TargetsHandle {
  getTargetMeshes: () => THREE.Object3D[];
  hitTarget: (id: number) => THREE.Vector3 | null;
}

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createTarget(id: number): Target {
  return {
    id,
    position: new THREE.Vector3(
      randomRange(TARGET_ZONE.minX, TARGET_ZONE.maxX),
      randomRange(TARGET_ZONE.minY, TARGET_ZONE.maxY),
      randomRange(TARGET_ZONE.maxZ, TARGET_ZONE.minZ)
    ),
    velocity: new THREE.Vector3(
      (Math.random() - 0.5) * randomRange(TARGET_SPEED_MIN, TARGET_SPEED_MAX),
      (Math.random() - 0.5) * randomRange(TARGET_SPEED_MIN, TARGET_SPEED_MAX) * 0.6,
      (Math.random() - 0.5) * randomRange(TARGET_SPEED_MIN, TARGET_SPEED_MAX) * 0.3
    ),
    alive: true,
    hitTime: 0,
    type: Math.random() > 0.5 ? 'orange' : 'cyan',
  };
}

const Targets = forwardRef<TargetsHandle, { started: boolean }>(({ started }, ref) => {
  const groupRef = useRef<THREE.Group>(null);
  const targetsRef = useRef<Target[]>([]);
  const nextIdRef = useRef(0);
  const lastWaveClearTime = useRef(0);

  const spawnWave = useCallback(() => {
    const count = WAVE_MIN + Math.floor(Math.random() * (WAVE_MAX - WAVE_MIN + 1));
    const newTargets: Target[] = [];
    for (let i = 0; i < count; i++) {
      newTargets.push(createTarget(nextIdRef.current++));
    }
    targetsRef.current = newTargets;
  }, []);

  useImperativeHandle(ref, () => ({
    getTargetMeshes: () => {
      if (!groupRef.current) return [];
      return groupRef.current.children.filter(
        (c) => c.userData.targetId !== undefined && c.userData.alive
      );
    },
    hitTarget: (id: number) => {
      const t = targetsRef.current.find((t) => t.id === id);
      if (!t || !t.alive) return null;
      t.alive = false;
      t.hitTime = Date.now();
      return t.position.clone();
    },
  }));

  useFrame((_, delta) => {
    if (!started) return;

    // Spawn first wave
    if (targetsRef.current.length === 0) {
      spawnWave();
      return;
    }

    const now = Date.now();
    const aliveCount = targetsRef.current.filter((t) => t.alive).length;

    // Check for wave clear
    if (aliveCount === 0) {
      if (lastWaveClearTime.current === 0) {
        lastWaveClearTime.current = now;
      } else if (now - lastWaveClearTime.current > WAVE_DELAY) {
        lastWaveClearTime.current = 0;
        spawnWave();
      }
      // Don't return — still need to update dead targets for fade
    }

    // Clamp delta to avoid jumps
    const dt = Math.min(delta, 0.05);

    // Update target positions
    for (const t of targetsRef.current) {
      if (!t.alive) continue;

      t.position.x += t.velocity.x * dt;
      t.position.y += t.velocity.y * dt;
      t.position.z += t.velocity.z * dt;

      // Bounce off boundaries
      if (t.position.x < TARGET_ZONE.minX || t.position.x > TARGET_ZONE.maxX) {
        t.velocity.x *= -1;
        t.position.x = Math.max(TARGET_ZONE.minX, Math.min(TARGET_ZONE.maxX, t.position.x));
      }
      if (t.position.y < TARGET_ZONE.minY || t.position.y > TARGET_ZONE.maxY) {
        t.velocity.y *= -1;
        t.position.y = Math.max(TARGET_ZONE.minY, Math.min(TARGET_ZONE.maxY, t.position.y));
      }
      if (t.position.z < TARGET_ZONE.maxZ || t.position.z > TARGET_ZONE.minZ) {
        t.velocity.z *= -1;
        t.position.z = Math.max(TARGET_ZONE.maxZ, Math.min(TARGET_ZONE.minZ, t.position.z));
      }
    }

    // Update meshes
    if (!groupRef.current) return;
    const children = groupRef.current.children;
    const targets = targetsRef.current;

    // Sync group children count
    while (children.length > targets.length * 2) {
      groupRef.current.remove(children[children.length - 1]);
    }

    // Mesh updates handled by TargetMeshes component below
  });

  // We render targets declaratively and update positions in useFrame via refs
  return (
    <group ref={groupRef}>
      {started &&
        targetsRef.current.map(() => null) /* rendered below via TargetMeshes */
      }
      <TargetMeshes targetsRef={targetsRef} started={started} groupRef={groupRef} />
    </group>
  );
});

Targets.displayName = 'Targets';

// Separate component to render target meshes imperatively for performance
function TargetMeshes({
  targetsRef,
  started,
  groupRef,
}: {
  targetsRef: React.MutableRefObject<Target[]>;
  started: boolean;
  groupRef: React.RefObject<THREE.Group>;
}) {
  const meshesRef = useRef<Map<number, THREE.Group>>(new Map());
  const materialCache = useRef({
    orange: new THREE.MeshStandardMaterial({
      color: COLORS.targetOrange,
      emissive: COLORS.targetOrange,
      emissiveIntensity: 1.5,
      roughness: 0.3,
      metalness: 0.2,
    }),
    cyan: new THREE.MeshStandardMaterial({
      color: COLORS.targetCyan,
      emissive: COLORS.targetCyan,
      emissiveIntensity: 1.5,
      roughness: 0.3,
      metalness: 0.2,
    }),
  });

  const headGeo = useRef(new THREE.SphereGeometry(0.25, 16, 12));
  const bodyGeo = useRef(new THREE.CapsuleGeometry(0.2, 0.6, 8, 12));

  useFrame(() => {
    if (!started || !groupRef.current) return;

    const targets = targetsRef.current;
    const meshes = meshesRef.current;
    const now = Date.now();
    const parent = groupRef.current;

    // Remove meshes for targets that no longer exist
    const targetIds = new Set(targets.map((t) => t.id));
    meshes.forEach((group, id) => {
      if (!targetIds.has(id)) {
        parent.remove(group);
        meshes.delete(id);
      }
    });

    for (const t of targets) {
      let group = meshes.get(t.id);

      if (!group) {
        // Create target mesh group
        group = new THREE.Group();
        group.userData.targetId = t.id;
        group.userData.alive = t.alive;

        const mat = t.type === 'orange' ? materialCache.current.orange : materialCache.current.cyan;

        // Body (capsule)
        const body = new THREE.Mesh(bodyGeo.current, mat);
        body.position.y = 0;
        body.userData.targetId = t.id;
        group.add(body);

        // Head (sphere)
        const head = new THREE.Mesh(headGeo.current, mat);
        head.position.y = 0.55;
        head.userData.targetId = t.id;
        group.add(head);

        parent.add(group);
        meshes.set(t.id, group);
      }

      group.userData.alive = t.alive;

      if (t.alive) {
        group.position.copy(t.position);
        group.visible = true;
        group.scale.setScalar(1);
      } else {
        // Fade/shrink dead targets
        const elapsed = now - t.hitTime;
        if (elapsed < 350) {
          const p = elapsed / 350;
          group.scale.setScalar(1 - p);
          group.position.y = t.position.y + p * 0.5;
          group.visible = true;
        } else {
          group.visible = false;
        }
      }
    }
  });

  return null;
}

export default Targets;
