import { useRef, useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import type { TargetsHandle } from './Targets';
import { ROOM_WIDTH, ROOM_HEIGHT, ROOM_DEPTH, SHAKE_BODYSHOT, SHAKE_HEADSHOT } from './constants';

interface ShootingSystemProps {
  started: boolean;
  onStart: () => void;
  onShoot: (hit: boolean, hitPosition?: THREE.Vector3, isHeadshot?: boolean) => void;
  targetsRef: React.RefObject<TargetsHandle>;
  onCameraShake: (intensity: number) => void;
}

export default function ShootingSystem({ started, onStart, onShoot, targetsRef, onCameraShake }: ShootingSystemProps) {
  const { camera, gl, scene } = useThree();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const isLockedRef = useRef(false);

  // Build wall collision meshes for miss detection
  const wallMeshes = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    if (wallMeshes.current.length > 0) return;
    const halfW = ROOM_WIDTH / 2;
    const halfD = ROOM_DEPTH / 2;

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -halfD);

    // Back wall
    const back = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_HEIGHT),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    back.position.set(0, ROOM_HEIGHT / 2, -ROOM_DEPTH);

    // Left wall
    const left = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_DEPTH, ROOM_HEIGHT),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    left.rotation.y = Math.PI / 2;
    left.position.set(-halfW, ROOM_HEIGHT / 2, -halfD);

    // Right wall
    const right = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_DEPTH, ROOM_HEIGHT),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    right.rotation.y = -Math.PI / 2;
    right.position.set(halfW, ROOM_HEIGHT / 2, -halfD);

    // Ceiling
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, ROOM_HEIGHT, -halfD);

    const walls = [floor, back, left, right, ceiling];
    walls.forEach((w) => {
      w.userData.isWall = true;
      scene.add(w);
    });
    wallMeshes.current = walls;
  }, [scene]);

  useEffect(() => {
    const onLock = () => { isLockedRef.current = true; };
    const onUnlock = () => { isLockedRef.current = false; };
    const controls = controlsRef.current;
    if (controls) {
      controls.addEventListener('lock', onLock);
      controls.addEventListener('unlock', onUnlock);
      return () => {
        controls.removeEventListener('lock', onLock);
        controls.removeEventListener('unlock', onUnlock);
      };
    }
  }, []);

  const handleClick = useCallback(() => {
    if (!isLockedRef.current) {
      controlsRef.current?.lock();
      if (!started) onStart();
      return;
    }

    if (!started) return;

    raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);

    const targets = targetsRef.current;
    if (!targets) {
      onShoot(false);
      return;
    }

    const meshes = targets.getTargetMeshes();
    const intersects = raycaster.current.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      // Check for headshot by traversing hit object hierarchy
      const obj: THREE.Object3D | null = intersects[0].object;
      let targetId: number | undefined;
      let isHeadshot = false;

      // First check if we directly hit a headshot sphere
      if (obj && obj.userData.isHeadshot) {
        isHeadshot = true;
      }

      // Find target ID
      let search: THREE.Object3D | null = obj;
      while (search) {
        if (search.userData.targetId !== undefined) {
          targetId = search.userData.targetId;
          break;
        }
        search = search.parent;
      }

      if (targetId !== undefined) {
        const hitPos = targets.hitTarget(targetId);
        if (hitPos) {
          onCameraShake(isHeadshot ? SHAKE_HEADSHOT : SHAKE_BODYSHOT);
          onShoot(true, hitPos, isHeadshot);
          return;
        }
      }
    }

    // Miss — detect wall impact for sparks
    const wallHits = raycaster.current.intersectObjects(wallMeshes.current, false);
    if (wallHits.length > 0) {
      const wp = wallHits[0].point;
      onShoot(false, wp, false);
    } else {
      onShoot(false);
    }
  }, [camera, started, onStart, onShoot, targetsRef, onCameraShake]);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [gl, handleClick]);

  return (
    <PointerLockControls ref={controlsRef} />
  );
}
