import { useMemo } from 'react';
import * as THREE from 'three';
import { ROOM_WIDTH, ROOM_HEIGHT, ROOM_DEPTH, COLORS } from './constants';

// Simple hash-noise shader for concrete walls
const concreteVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const concreteFragmentShader = `
  uniform vec3 uColor;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    float n = hash(floor(vWorldPos.xz * 8.0)) * 0.08 - 0.04;
    float n2 = hash(floor(vWorldPos.xy * 12.0)) * 0.05 - 0.025;
    vec3 col = uColor + vec3(n + n2);
    gl_FragColor = vec4(col, 1.0);
  }
`;

// Metal floor grid shader
const floorVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const floorFragmentShader = `
  uniform vec3 uColor;
  uniform vec3 uLineColor;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    vec2 grid = abs(fract(vWorldPos.xz * 0.5) - 0.5);
    float fw = fwidth(vWorldPos.x * 0.5) * 1.5;
    float lineX = smoothstep(fw, 0.0, grid.x);
    float lineZ = smoothstep(fw, 0.0, grid.y);
    float line = max(lineX, lineZ);
    vec3 col = mix(uColor, uLineColor, line * 0.3);
    gl_FragColor = vec4(col, 1.0);
  }
`;

function SandbagStack({ position, count }: { position: [number, number, number]; count: number }) {
  const bags = [];
  for (let row = 0; row < count; row++) {
    const bagsInRow = count - row;
    for (let i = 0; i < bagsInRow; i++) {
      const x = (i - (bagsInRow - 1) / 2) * 0.5;
      bags.push(
        <mesh
          key={`${row}-${i}`}
          position={[x, row * 0.25 + 0.125, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.45, 0.22, 0.35]} />
          <meshStandardMaterial color={COLORS.sandbag} roughness={0.95} metalness={0} />
        </mesh>
      );
    }
  }
  return <group position={position}>{bags}</group>;
}

function JerseyBarrier({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Base */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.4, 2]} />
        <meshStandardMaterial color={COLORS.barrier} roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Top */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.3, 2]} />
        <meshStandardMaterial color={COLORS.barrier} roughness={0.85} metalness={0.05} />
      </mesh>
    </group>
  );
}

function LanePost({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Post */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[0.05, 1.5, 0.05]} />
        <meshStandardMaterial color={COLORS.metal} metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Base plate */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.2, 0.04, 0.2]} />
        <meshStandardMaterial color={COLORS.metal} metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

export default function Scene() {
  const halfW = ROOM_WIDTH / 2;
  const halfD = ROOM_DEPTH / 2;

  const concreteMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: concreteVertexShader,
    fragmentShader: concreteFragmentShader,
    uniforms: { uColor: { value: new THREE.Color(COLORS.wallSide) } },
  }), []);

  const concreteBackMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: concreteVertexShader,
    fragmentShader: concreteFragmentShader,
    uniforms: { uColor: { value: new THREE.Color(COLORS.wallBack) } },
  }), []);

  const floorMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: floorVertexShader,
    fragmentShader: floorFragmentShader,
    uniforms: {
      uColor: { value: new THREE.Color(COLORS.floor) },
      uLineColor: { value: new THREE.Color(COLORS.metal) },
    },
  }), []);

  return (
    <group>
      {/* Ambient fill — slightly warm */}
      <ambientLight color={COLORS.ambient} intensity={0.4} />

      {/* Directional light with shadows */}
      <directionalLight
        position={[5, ROOM_HEIGHT - 1, -10]}
        intensity={1.0}
        color="#fff8ee"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-halfW}
        shadow-camera-right={halfW}
        shadow-camera-top={ROOM_HEIGHT}
        shadow-camera-bottom={0}
        shadow-camera-near={0.1}
        shadow-camera-far={ROOM_DEPTH + 5}
      />

      {/* 3 overhead fluorescent bar lights */}
      {[-8, -15, -22].map((z) => (
        <group key={z}>
          <mesh position={[0, ROOM_HEIGHT - 0.1, z]}>
            <boxGeometry args={[2.5, 0.06, 0.15]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#fffbe8"
              emissiveIntensity={4}
            />
          </mesh>
          <pointLight
            position={[0, ROOM_HEIGHT - 0.3, z]}
            intensity={1.5}
            color="#fff8e8"
            distance={20}
            decay={2}
            castShadow={false}
          />
        </group>
      ))}

      {/* Floor — metal grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -halfD]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <primitive object={floorMat} attach="material" />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_HEIGHT, -halfD]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color={COLORS.ceiling} roughness={1} metalness={0} />
      </mesh>

      {/* Back wall — concrete shader */}
      <mesh position={[0, ROOM_HEIGHT / 2, -ROOM_DEPTH]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <primitive object={concreteBackMat} attach="material" />
      </mesh>

      {/* Left wall */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-halfW, ROOM_HEIGHT / 2, -halfD]} receiveShadow>
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        <primitive object={concreteMat} attach="material" />
      </mesh>

      {/* Right wall */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[halfW, ROOM_HEIGHT / 2, -halfD]} receiveShadow>
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        <primitive object={concreteMat} attach="material" />
      </mesh>

      {/* Sandbag barriers along sides */}
      <SandbagStack position={[-8, 0, -6]} count={3} />
      <SandbagStack position={[8, 0, -6]} count={3} />
      <SandbagStack position={[-7, 0, -12]} count={2} />
      <SandbagStack position={[7, 0, -12]} count={2} />

      {/* Jersey barriers mid-range */}
      <JerseyBarrier position={[-5, 0, -10]} rotation={0.2} />
      <JerseyBarrier position={[5, 0, -10]} rotation={-0.2} />
      <JerseyBarrier position={[0, 0, -8]} />

      {/* Lane divider posts */}
      {[-6, -3, 0, 3, 6].map((x) =>
        [-5, -10, -15].map((z) => (
          <LanePost key={`${x}_${z}`} position={[x, 0, z]} />
        ))
      )}
    </group>
  );
}
