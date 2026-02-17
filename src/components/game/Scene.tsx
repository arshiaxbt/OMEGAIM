import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROOM_WIDTH, ROOM_HEIGHT, ROOM_DEPTH, COLORS } from './constants';

export default function Scene() {
  const neonRef1 = useRef<THREE.PointLight>(null);
  const neonRef2 = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 0.8 + Math.sin(t * 2) * 0.2;
    if (neonRef1.current) neonRef1.current.intensity = pulse * 2;
    if (neonRef2.current) neonRef2.current.intensity = pulse * 2;
  });

  const halfW = ROOM_WIDTH / 2;
  const halfD = ROOM_DEPTH / 2;

  return (
    <group>
      {/* Ambient light */}
      <ambientLight color={COLORS.ambient} intensity={0.3} />

      {/* Main overhead lights */}
      <pointLight position={[0, ROOM_HEIGHT - 0.5, -10]} intensity={1.5} color="#ffffff" distance={25} decay={2} />
      <pointLight position={[0, ROOM_HEIGHT - 0.5, -20]} intensity={1.2} color="#ffffff" distance={25} decay={2} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -halfD]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color={COLORS.floor} roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_HEIGHT, -halfD]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color={COLORS.ceiling} roughness={1} metalness={0} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, ROOM_HEIGHT / 2, -ROOM_DEPTH]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color={COLORS.wallBack} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Left wall */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-halfW, ROOM_HEIGHT / 2, -halfD]}>
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color={COLORS.wallSide} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Right wall */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[halfW, ROOM_HEIGHT / 2, -halfD]}>
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        <meshStandardMaterial color={COLORS.wallSide} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Neon strip - left wall (blue) */}
      <mesh position={[-halfW + 0.05, ROOM_HEIGHT * 0.7, -halfD]}>
        <boxGeometry args={[0.08, 0.08, ROOM_DEPTH - 2]} />
        <meshStandardMaterial color={COLORS.neonBlue} emissive={COLORS.neonBlue} emissiveIntensity={3} />
      </mesh>
      <pointLight ref={neonRef1} position={[-halfW + 0.5, ROOM_HEIGHT * 0.7, -halfD]} color={COLORS.neonBlue} intensity={2} distance={12} decay={2} />

      {/* Neon strip - right wall (blue) */}
      <mesh position={[halfW - 0.05, ROOM_HEIGHT * 0.7, -halfD]}>
        <boxGeometry args={[0.08, 0.08, ROOM_DEPTH - 2]} />
        <meshStandardMaterial color={COLORS.neonBlue} emissive={COLORS.neonBlue} emissiveIntensity={3} />
      </mesh>
      <pointLight ref={neonRef2} position={[halfW - 0.5, ROOM_HEIGHT * 0.7, -halfD]} color={COLORS.neonBlue} intensity={2} distance={12} decay={2} />

      {/* Neon strip - back wall (orange) */}
      <mesh position={[0, ROOM_HEIGHT * 0.85, -ROOM_DEPTH + 0.05]}>
        <boxGeometry args={[ROOM_WIDTH - 2, 0.08, 0.08]} />
        <meshStandardMaterial color={COLORS.neonOrange} emissive={COLORS.neonOrange} emissiveIntensity={3} />
      </mesh>
      <pointLight position={[0, ROOM_HEIGHT * 0.85, -ROOM_DEPTH + 1]} color={COLORS.neonOrange} intensity={1.5} distance={10} decay={2} />

      {/* Floor lane markings */}
      {[-6, -3, 0, 3, 6].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, -halfD]}>
          <planeGeometry args={[0.04, ROOM_DEPTH - 4]} />
          <meshStandardMaterial color="#2a2a30" emissive="#2a2a30" emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
}
