"use client";

import { useRef } from "react";
import * as THREE from "three";

interface CameraBodyProps {
  bodyRef: React.RefObject<THREE.Group | null>;
}

export default function CameraBody({ bodyRef }: CameraBodyProps) {
  return (
    <group ref={bodyRef} position={[0, -0.2, -10]} scale={[0.001, 0.001, 0.001]}>
      {/* Main Body block */}
      <mesh>
        <boxGeometry args={[3.4, 2.1, 1.3]} />
        <meshStandardMaterial color="#1c1917" roughness={0.65} metalness={0.3} />
      </mesh>
      
      {/* Right Hand Grip */}
      <mesh position={[1.4, 0, 0.25]}>
        <boxGeometry args={[0.6, 2.1, 0.8]} />
        <meshStandardMaterial color="#0c0c0e" roughness={0.8} metalness={0.1} />
      </mesh>
      
      {/* Lens Mount Flange (Silver metallic ring) */}
      <mesh position={[0, 0, 0.66]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.72, 1.72, 0.06, 32]} />
        <meshStandardMaterial color="#d4d4d8" roughness={0.15} metalness={0.9} />
      </mesh>
      
      {/* Gold mount contact dot inside */}
      <mesh position={[-1.2, 0.8, 0.67]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      
      {/* Pentaprism Viewfinder Hump */}
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[1.2, 0.4, 1.1]} />
        <meshStandardMaterial color="#1c1917" roughness={0.6} />
      </mesh>
      
      {/* Hot Shoe mount (silver bracket on top of viewfinder) */}
      <mesh position={[0, 1.48, 0]}>
        <boxGeometry args={[0.4, 0.06, 0.5]} />
        <meshStandardMaterial color="#d4d4d8" roughness={0.2} metalness={0.9} />
      </mesh>
      
      {/* Mode Dial (top left) */}
      <mesh position={[-1.0, 1.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.12, 24]} />
        <meshStandardMaterial color="#27272a" roughness={0.4} metalness={0.7} />
      </mesh>
      
      {/* Shutter Button (top right on grip) */}
      <mesh position={[1.4, 1.1, 0.25]}>
        <cylinderGeometry args={[0.16, 0.16, 0.08, 16]} />
        <meshStandardMaterial color="#d4d4d8" roughness={0.2} metalness={0.9} />
      </mesh>
      
      {/* Red line accent (front of grip) */}
      <mesh position={[1.12, 0.4, 0.66]}>
        <boxGeometry args={[0.04, 0.5, 0.02]} />
        <meshBasicMaterial color="#dc2626" />
      </mesh>
      
      {/* Rear LCD Screen */}
      <mesh position={[0, 0, -0.66]}>
        <planeGeometry args={[2.6, 1.6]} />
        <meshStandardMaterial color="#09090b" roughness={0.9} metalness={0.1} />
      </mesh>
    </group>
  );
}
