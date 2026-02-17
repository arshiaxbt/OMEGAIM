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

type MovementType = 'stationary' | 'lateral' | 'erratic';

interface Target {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  alive: boolean;
  hitTime: number;
  spawnTime: number;
  movementType: MovementType;
  erraticTimer: number;
  baseY: number;
}

export interface TargetsHandle {
  getTargetMeshes: () => THREE.Object3D[];
  hitTarget: (id: number) => THREE.Vector3 | null;
}

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createTarget(id: number): Target {
  const movementTypes: MovementType[] = ['stationary', 'lateral', 'erratic'];
  const movementType = movementTypes[Math.floor(Math.random() * 3)];
  const baseY = randomRange(TARGET_ZONE.minY, TARGET_ZONE.maxY);

  let velocity = new THREE.Vector3(0, 0, 0);
  if (movementType === 'lateral') {
    velocity = new THREE.Vector3(
      (Math.random() > 0.5 ? 1 : -1) * randomRange(TARGET_SPEED_MIN, TARGET_SPEED_MAX),
      0,
      0
    );
  } else if (movementType === 'erratic') {
    velocity = new THREE.Vector3(
      (Math.random() - 0.5) * randomRange(TARGET_SPEED_MIN, TARGET_SPEED_MAX),
      (Math.random() - 0.5) * randomRange(TARGET_SPEED_MIN, TARGET_SPEED_MAX) * 0.4,
      (Math.random() - 0.5) * randomRange(TARGET_SPEED_MIN, TARGET_SPEED_MAX) * 0.2
    );
  }

  return {
    id,
    position: new THREE.Vector3(
      randomRange(TARGET_ZONE.minX, TARGET_ZONE.maxX),
      -1.5, // Start below floor for pop-up
      randomRange(TARGET_ZONE.maxZ, TARGET_ZONE.minZ)
    ),
    velocity,
    alive: true,
    hitTime: 0,
    spawnTime: Date.now(),
    movementType,
    erraticTimer: 0,
    baseY,
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

    if (targetsRef.current.length === 0) {
      spawnWave();
      return;
    }

    const now = Date.now();
    const aliveCount = targetsRef.current.filter((t) => t.alive).length;

    if (aliveCount === 0) {
      if (lastWaveClearTime.current === 0) {
        lastWaveClearTime.current = now;
      } else if (now - lastWaveClearTime.current > WAVE_DELAY) {
        lastWaveClearTime.current = 0;
        spawnWave();
      }
    }

    const dt = Math.min(delta, 0.05);

    for (const t of targetsRef.current) {
      if (!t.alive) continue;

      // Pop-up spawn animation (ease-out cubic, 400ms)
      const spawnElapsed = now - t.spawnTime;
      if (spawnElapsed < 400) {
        const p = spawnElapsed / 400;
        const ease = 1 - Math.pow(1 - p, 3);
        t.position.y = -1.5 + (t.baseY + 1.5) * ease;
        continue; // Don't move during spawn
      }

      // Erratic: random direction changes
      if (t.movementType === 'erratic') {
        t.erraticTimer -= dt;
        if (t.erraticTimer <= 0) {
          t.erraticTimer = 0.3 + Math.random() * 0.7;
          t.velocity.set(
            (Math.random() - 0.5) * randomRange(TARGET_SPEED_MIN, TARGET_SPEED_MAX),
            (Math.random() - 0.5) * randomRange(TARGET_SPEED_MIN, TARGET_SPEED_MAX) * 0.4,
            (Math.random() - 0.5) * randomRange(TARGET_SPEED_MIN, TARGET_SPEED_MAX) * 0.2
          );
        }
      }

      // Lateral: sine wave overlay
      if (t.movementType === 'lateral') {
        t.position.y = t.baseY + Math.sin(now * 0.002 + t.id) * 0.3;
      }

      t.position.x += t.velocity.x * dt;
      if (t.movementType !== 'lateral') {
        t.position.y += t.velocity.y * dt;
      }
      t.position.z += t.velocity.z * dt;

      // Bounce
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

    if (!groupRef.current) return;
  });

  return (
    <group ref={groupRef}>
      <TargetMeshes targetsRef={targetsRef} started={started} groupRef={groupRef} />
    </group>
  );
});

Targets.displayName = 'Targets';

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

  // Geometries
  const headGeo = useRef(new THREE.SphereGeometry(0.18, 12, 10));
  const neckGeo = useRef(new THREE.CylinderGeometry(0.06, 0.08, 0.1, 8));
  const torsoGeo = useRef(new THREE.BoxGeometry(0.4, 0.5, 0.2));
  const shoulderGeo = useRef(new THREE.BoxGeometry(0.12, 0.12, 0.18));
  const armGeo = useRef(new THREE.BoxGeometry(0.08, 0.35, 0.08));
  const pelvisGeo = useRef(new THREE.BoxGeometry(0.3, 0.2, 0.18));
  const headHitGeo = useRef(new THREE.SphereGeometry(0.22, 8, 8));

  // Materials
  const bodyMat = useRef(new THREE.MeshStandardMaterial({
    color: COLORS.targetBody,
    roughness: 0.7,
    metalness: 0.1,
  }));
  const edgeMat = useRef(new THREE.MeshStandardMaterial({
    color: COLORS.targetEdge,
    emissive: COLORS.targetEdge,
    emissiveIntensity: 0.8,
    side: THREE.BackSide,
    roughness: 0.5,
  }));
  const hitFlashMat = useRef(new THREE.MeshStandardMaterial({
    color: COLORS.targetHitFlash,
    emissive: COLORS.targetHitFlash,
    emissiveIntensity: 3,
    roughness: 0.5,
  }));
  const invisibleMat = useRef(new THREE.MeshBasicMaterial({
    visible: false,
  }));

  useFrame(() => {
    if (!started || !groupRef.current) return;

    const targets = targetsRef.current;
    const meshes = meshesRef.current;
    const now = Date.now();
    const parent = groupRef.current;

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
        group = new THREE.Group();
        group.userData.targetId = t.id;
        group.userData.alive = t.alive;

        // Head
        const head = new THREE.Mesh(headGeo.current, bodyMat.current);
        head.position.y = 0.62;
        head.userData.targetId = t.id;
        head.castShadow = true;
        group.add(head);

        // Head edge glow (BackSide)
        const headEdge = new THREE.Mesh(headGeo.current, edgeMat.current);
        headEdge.position.y = 0.62;
        headEdge.scale.setScalar(1.05);
        group.add(headEdge);

        // Invisible headshot collision sphere
        const headHit = new THREE.Mesh(headHitGeo.current, invisibleMat.current);
        headHit.position.y = 0.62;
        headHit.userData.targetId = t.id;
        headHit.userData.isHeadshot = true;
        group.add(headHit);

        // Neck
        const neck = new THREE.Mesh(neckGeo.current, bodyMat.current);
        neck.position.y = 0.48;
        neck.userData.targetId = t.id;
        group.add(neck);

        // Torso
        const torso = new THREE.Mesh(torsoGeo.current, bodyMat.current);
        torso.position.y = 0.18;
        torso.userData.targetId = t.id;
        torso.castShadow = true;
        group.add(torso);

        // Torso edge glow
        const torsoEdge = new THREE.Mesh(torsoGeo.current, edgeMat.current);
        torsoEdge.position.y = 0.18;
        torsoEdge.scale.set(1.05, 1.03, 1.05);
        group.add(torsoEdge);

        // Shoulders
        for (const side of [-1, 1]) {
          const shoulder = new THREE.Mesh(shoulderGeo.current, bodyMat.current);
          shoulder.position.set(side * 0.26, 0.38, 0);
          shoulder.userData.targetId = t.id;
          group.add(shoulder);
        }

        // Arms
        for (const side of [-1, 1]) {
          const arm = new THREE.Mesh(armGeo.current, bodyMat.current);
          arm.position.set(side * 0.28, 0.08, 0);
          arm.userData.targetId = t.id;
          group.add(arm);
        }

        // Pelvis
        const pelvis = new THREE.Mesh(pelvisGeo.current, bodyMat.current);
        pelvis.position.y = -0.15;
        pelvis.userData.targetId = t.id;
        group.add(pelvis);

        parent.add(group);
        meshes.set(t.id, group);
      }

      group.userData.alive = t.alive;

      if (t.alive) {
        group.position.copy(t.position);
        group.visible = true;
        group.scale.setScalar(1);
        group.rotation.set(0, 0, 0);

        // Reset materials to normal
        group.children.forEach((child) => {
          if (child instanceof THREE.Mesh && child.material === hitFlashMat.current) {
            child.material = bodyMat.current;
          }
        });
      } else {
        // Death animation: flash red, rotate/fall, sink below floor
        const elapsed = now - t.hitTime;
        if (elapsed < 600) {
          group.visible = true;
          const p = elapsed / 600;

          // Flash red for first 100ms
          if (elapsed < 100) {
            group.children.forEach((child) => {
              if (child instanceof THREE.Mesh && child.material === bodyMat.current) {
                child.material = hitFlashMat.current;
              }
            });
          }

          // Rotate and fall
          group.rotation.x = p * 1.5;
          group.position.y = t.position.y - p * 2;
          group.scale.setScalar(1 - p * 0.3);
        } else {
          group.visible = false;
        }
      }
    }
  });

  return null;
}

export default Targets;
