import { useRef, useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import type { TargetsHandle } from './Targets';

interface ShootingSystemProps {
  started: boolean;
  onStart: () => void;
  onShoot: (hit: boolean, hitPosition?: THREE.Vector3) => void;
  targetsRef: React.RefObject<TargetsHandle>;
}

export default function ShootingSystem({ started, onStart, onShoot, targetsRef }: ShootingSystemProps) {
  const { camera, gl } = useThree();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const isLockedRef = useRef(false);

  // Track pointer lock state
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
      // Request pointer lock and start game
      controlsRef.current?.lock();
      if (!started) onStart();
      return;
    }

    if (!started) return;

    // Fire ray from camera center
    raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);

    const targets = targetsRef.current;
    if (!targets) {
      onShoot(false);
      return;
    }

    const meshes = targets.getTargetMeshes();
    const intersects = raycaster.current.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      // Find the target ID from the hit object
      let obj: THREE.Object3D | null = intersects[0].object;
      let targetId: number | undefined;
      while (obj) {
        if (obj.userData.targetId !== undefined) {
          targetId = obj.userData.targetId;
          break;
        }
        obj = obj.parent;
      }

      if (targetId !== undefined) {
        const hitPos = targets.hitTarget(targetId);
        if (hitPos) {
          onShoot(true, hitPos);
          return;
        }
      }
    }

    onShoot(false);
  }, [camera, started, onStart, onShoot, targetsRef]);

  // Listen for clicks on the canvas
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [gl, handleClick]);

  return (
    <PointerLockControls ref={controlsRef} />
  );
}
