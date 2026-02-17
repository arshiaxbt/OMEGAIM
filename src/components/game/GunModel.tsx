import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GUN_POSITION, GUN_RECOIL_KICK, GUN_RECOIL_ROTATE, GUN_RECOIL_RETURN_SPEED, GUN_SWAY_SPEED, GUN_SWAY_AMOUNT } from './constants';

interface GunModelProps {
  recoilTrigger: number;
  showMuzzleFlash: boolean;
}

export default function GunModel({ recoilTrigger, showMuzzleFlash }: GunModelProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const recoilZ = useRef(0);
  const recoilRot = useRef(0);
  const lastTrigger = useRef(0);
  const flashRef = useRef<THREE.Mesh>(null);
  const flashLightRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);
    const t = performance.now() / 1000;

    // Trigger recoil
    if (recoilTrigger !== lastTrigger.current) {
      lastTrigger.current = recoilTrigger;
      recoilZ.current = GUN_RECOIL_KICK;
      recoilRot.current = GUN_RECOIL_ROTATE;
    }

    // Return from recoil (spring)
    recoilZ.current += (0 - recoilZ.current) * GUN_RECOIL_RETURN_SPEED * dt;
    recoilRot.current += (0 - recoilRot.current) * GUN_RECOIL_RETURN_SPEED * dt;

    // Idle sway (breathing)
    const swayX = Math.sin(t * GUN_SWAY_SPEED) * GUN_SWAY_AMOUNT;
    const swayY = Math.sin(t * GUN_SWAY_SPEED * 0.7) * GUN_SWAY_AMOUNT * 0.5;

    // Position gun relative to camera
    const gun = groupRef.current;
    gun.position.set(0, 0, 0);
    gun.rotation.set(0, 0, 0);
    gun.updateMatrix();

    // Copy camera world transform
    gun.quaternion.copy(camera.quaternion);
    gun.position.copy(camera.position);

    // Offset in camera-local space
    const offset = new THREE.Vector3(
      GUN_POSITION.x + swayX,
      GUN_POSITION.y + swayY,
      GUN_POSITION.z + recoilZ.current
    );
    offset.applyQuaternion(camera.quaternion);
    gun.position.add(offset);

    // Apply recoil rotation (pitch up)
    gun.rotateX(-recoilRot.current);

    // Muzzle flash
    if (flashRef.current) {
      flashRef.current.visible = showMuzzleFlash;
    }
    if (flashLightRef.current) {
      flashLightRef.current.visible = showMuzzleFlash;
    }
  });

  const gunmetal = { color: '#2a2a2e', metalness: 0.9, roughness: 0.2 };
  const darkMetal = { color: '#1a1a1e', metalness: 0.85, roughness: 0.25 };

  return (
    <group ref={groupRef} renderOrder={999}>
      {/* Receiver / main body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.04, 0.05, 0.22]} />
        <meshStandardMaterial {...gunmetal} />
      </mesh>

      {/* Barrel */}
      <mesh position={[0, 0.01, -0.22]}>
        <boxGeometry args={[0.025, 0.025, 0.2]} />
        <meshStandardMaterial {...darkMetal} />
      </mesh>

      {/* Barrel tip / muzzle brake */}
      <mesh position={[0, 0.01, -0.33]}>
        <boxGeometry args={[0.03, 0.03, 0.04]} />
        <meshStandardMaterial {...gunmetal} />
      </mesh>

      {/* Magazine */}
      <mesh position={[0, -0.06, 0.02]}>
        <boxGeometry args={[0.03, 0.08, 0.06]} />
        <meshStandardMaterial {...darkMetal} />
      </mesh>

      {/* Grip */}
      <mesh position={[0, -0.06, 0.1]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.03, 0.07, 0.03]} />
        <meshStandardMaterial {...gunmetal} />
      </mesh>

      {/* Stock */}
      <mesh position={[0, 0, 0.18]}>
        <boxGeometry args={[0.035, 0.05, 0.1]} />
        <meshStandardMaterial {...gunmetal} />
      </mesh>

      {/* Stock butt */}
      <mesh position={[0, -0.01, 0.25]}>
        <boxGeometry args={[0.04, 0.06, 0.04]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Rail (top) */}
      <mesh position={[0, 0.032, -0.05]}>
        <boxGeometry args={[0.025, 0.008, 0.18]} />
        <meshStandardMaterial {...darkMetal} />
      </mesh>

      {/* Front iron sight */}
      <mesh position={[0, 0.05, -0.18]}>
        <boxGeometry args={[0.006, 0.02, 0.006]} />
        <meshStandardMaterial color="#ff3300" emissive="#ff3300" emissiveIntensity={0.3} metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Rear iron sight */}
      <mesh position={[0, 0.05, 0.02]}>
        <boxGeometry args={[0.025, 0.015, 0.008]} />
        <meshStandardMaterial {...darkMetal} />
      </mesh>

      {/* Muzzle flash — emissive sphere */}
      <mesh ref={flashRef} position={[0, 0.01, -0.36]} visible={false}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial
          color="#ffaa00"
          emissive="#ffaa00"
          emissiveIntensity={8}
          transparent
          opacity={0.9}
        />
      </mesh>
      <pointLight
        ref={flashLightRef}
        position={[0, 0.01, -0.36]}
        color="#ffaa00"
        intensity={3}
        distance={5}
        decay={2}
        visible={false}
      />
    </group>
  );
}
