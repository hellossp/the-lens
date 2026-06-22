"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";

interface CameraBodyProps {
  bodyRef: React.RefObject<THREE.Group | null>;
}

// A simple deterministic pseudo-random generator to satisfy React render-purity rules
function createRandom(seed: number) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export default function CameraBody({ bodyRef }: CameraBodyProps) {
  // Procedural pebbled leatherette texture for the body chassis
  const leatherTexture = useMemo(() => {
    if (typeof window === "undefined") return null;
    const random = createRandom(42);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Base dark grey
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Fine pebbles/grain noise
      for (let i = 0; i < 15000; i++) {
        const x = random() * canvas.width;
        const y = random() * canvas.height;
        const radius = 0.5 + random() * 1.5;
        // Vary grayscale values to create depth in bumpmap
        const gray = Math.floor(128 + (random() - 0.5) * 60);
        ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 4);
    return texture;
  }, []);

  // Procedural knurling bumpmap for metallic control dials
  const knurledTexture = useMemo(() => {
    if (typeof window === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#444444";
      ctx.lineWidth = 1.5;
      
      // Draw tight knurled crisscross pattern
      for (let i = -128; i < 256; i += 6) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 64, 64);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(i + 64, 0);
        ctx.lineTo(i, 64);
        ctx.stroke();
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 1);
    return texture;
  }, []);

  return (
    <group ref={bodyRef} position={[0, -0.2, -10]} scale={[0.001, 0.001, 0.001]}>
      {/* 
        1. MAIN CAMERA CHASSIS (Lower Body Section)
        Pebbled leatherette cladding with beveled edges
      */}
      <RoundedBox
        args={[3.4, 1.4, 1.26]}
        radius={0.06}
        smoothness={4}
        position={[0, -0.15, 0]}
      >
        <meshStandardMaterial
          color="#161616"
          roughness={0.75}
          metalness={0.15}
          bumpMap={leatherTexture || undefined}
          bumpScale={0.015}
        />
      </RoundedBox>

      {/* 
        2. DYNAMIC ERGONOMIC HAND GRIP
        Wrapped in leatherette with rounded front contour
      */}
      <RoundedBox
        args={[0.62, 1.3, 0.88]}
        radius={0.16}
        smoothness={5}
        position={[1.28, -0.15, 0.22]}
      >
        <meshStandardMaterial
          color="#121212"
          roughness={0.8}
          metalness={0.1}
          bumpMap={leatherTexture || undefined}
          bumpScale={0.018}
        />
      </RoundedBox>

      {/* 
        3. PREMIUM TWO-TONE METALLIC PLATES
        Top & Bottom Plates: Brushed Titanium/Platinum Style
      */}
      {/* Top Plate */}
      <RoundedBox
        args={[3.4, 0.45, 1.27]}
        radius={0.05}
        smoothness={4}
        position={[0, 0.775, 0]}
      >
        <meshStandardMaterial
          color="#cfd2d6"
          roughness={0.22}
          metalness={0.85}
        />
      </RoundedBox>

      {/* Bottom Plate */}
      <RoundedBox
        args={[3.4, 0.15, 1.27]}
        radius={0.02}
        smoothness={3}
        position={[0, -0.925, 0]}
      >
        <meshStandardMaterial
          color="#cfd2d6"
          roughness={0.25}
          metalness={0.85}
        />
      </RoundedBox>

      {/* 
        4. PENTAPRISM VIEW-FINDER HUMP
        Styled after luxury retro mirrorless frames
      */}
      <group position={[0, 1.175, 0]}>
        <RoundedBox
          args={[1.15, 0.45, 1.15]}
          radius={0.04}
          smoothness={4}
        >
          <meshStandardMaterial
            color="#cfd2d6"
            roughness={0.22}
            metalness={0.85}
          />
        </RoundedBox>
        
        {/* Hot Shoe mount bracket on top */}
        <mesh position={[0, 0.24, 0.05]}>
          <boxGeometry args={[0.48, 0.05, 0.58]} />
          <meshStandardMaterial
            color="#27272a"
            roughness={0.3}
            metalness={0.9}
          />
        </mesh>
        <mesh position={[0, 0.27, 0.05]}>
          <boxGeometry args={[0.34, 0.02, 0.48]} />
          <meshStandardMaterial
            color="#a1a1aa"
            roughness={0.15}
            metalness={0.95}
          />
        </mesh>
      </group>

      {/* 
        5. LENS MOUNT FLANGE RING & DETAILED CONTACTS
      */}
      {/* Chrome Mounting Ring */}
      <mesh position={[0, -0.1, 0.635]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.54, 0.54, 0.06, 64]} />
        <meshStandardMaterial
          color="#e4e4e7"
          roughness={0.12}
          metalness={0.95}
        />
      </mesh>

      {/* Dark Inner Mount Chamber */}
      <mesh position={[0, -0.1, 0.655]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.49, 0.49, 0.03, 48]} />
        <meshStandardMaterial
          color="#1f1f23"
          roughness={0.5}
          metalness={0.8}
        />
      </mesh>

      {/* 4 Mounting Screws inside Mount Flange */}
      {[
        { x: 0.25, y: 0.15 },
        { x: -0.25, y: 0.15 },
        { x: 0.25, y: -0.35 },
        { x: -0.25, y: -0.35 },
      ].map((pos, i) => (
        <group key={i} position={[pos.x, pos.y, 0.67]}>
          {/* Screw Head */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.01, 8]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Cross indent */}
          <mesh position={[0, 0, 0.005]}>
            <boxGeometry args={[0.004, 0.022, 0.01]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, 0, 0.005]}>
            <boxGeometry args={[0.022, 0.004, 0.01]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      ))}

      {/* Leica-style Red Alignment Dot */}
      <mesh position={[-0.41, 0.15, 0.65]}>
        <sphereGeometry args={[0.018, 16, 16]} />
        <meshBasicMaterial color="#dc2626" />
      </mesh>

      {/* Lens Release Button Catch */}
      <group position={[-0.41, -0.2, 0.65]} rotation={[Math.PI / 2, 0, -Math.PI / 4]}>
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, 0.04, 16]} />
          <meshStandardMaterial color="#d4d4d8" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Red dot mark on release lock */}
        <mesh position={[0, 0.008, 0.03]}>
          <sphereGeometry args={[0.008, 8, 8]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      </group>

      {/* 
        6. REAR VIEWFINDER EYEPIECE & DISPLAY GLASS
      */}
      {/* Matte black rubber eyepiece */}
      <RoundedBox
        args={[0.72, 0.48, 0.1]}
        radius={0.02}
        smoothness={4}
        position={[0, 1.12, -0.59]}
      >
        <meshStandardMaterial color="#09090b" roughness={0.95} />
      </RoundedBox>
      {/* Viewfinder glass pane */}
      <mesh position={[0, 1.12, -0.645]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.55, 0.32]} />
        <meshPhysicalMaterial
          color="#38bdf8"
          transmission={0.8}
          roughness={0.05}
          ior={1.5}
          thickness={0.05}
        />
      </mesh>

      {/* 
        7. KNURLED METALLIC TOP CONTROLS & DIALS
      */}
      {/* Mode Dial (Top Left) */}
      <group position={[-1.02, 0.98, 0]} rotation={[0, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.32, 0.32, 0.14, 32]} />
          <meshStandardMaterial
            color="#27272a"
            roughness={0.4}
            metalness={0.8}
            bumpMap={knurledTexture || undefined}
            bumpScale={0.06}
          />
        </mesh>
        {/* Beveled Top Plate of Dial */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.03, 32]} />
          <meshStandardMaterial color="#0c0c0e" roughness={0.5} metalness={0.9} />
        </mesh>
      </group>

      {/* Exposure Compensation Dial (Top Right Rear) */}
      <group position={[0.72, 0.96, -0.12]}>
        <mesh>
          <cylinderGeometry args={[0.26, 0.26, 0.12, 32]} />
          <meshStandardMaterial
            color="#cfd2d6"
            roughness={0.25}
            metalness={0.95}
            bumpMap={knurledTexture || undefined}
            bumpScale={0.05}
          />
        </mesh>
        <mesh position={[0, 0.07, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.02, 32]} />
          <meshStandardMaterial color="#1c1917" roughness={0.4} />
        </mesh>
      </group>

      {/* Refined Shutter Release Assembly */}
      <group position={[1.28, 0.96, 0.25]}>
        {/* Chrome Shutter Collar Bezel */}
        <mesh>
          <cylinderGeometry args={[0.2, 0.2, 0.1, 24]} />
          <meshStandardMaterial color="#e4e4e7" roughness={0.1} metalness={0.95} />
        </mesh>
        {/* Soft-Release Red Button inside collar */}
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.06, 16]} />
          <meshStandardMaterial
            color="#dc2626"
            roughness={0.18}
            metalness={0.75}
          />
        </mesh>
      </group>

      {/* Red line accent on front grip face */}
      <mesh position={[1.09, 0.35, 0.62]}>
        <boxGeometry args={[0.045, 0.45, 0.02]} />
        <meshBasicMaterial color="#dc2626" />
      </mesh>

      {/* 
        8. REAR LCD VIEWSCREEN
      */}
      {/* Glossy Black Bezel Frame */}
      <mesh position={[0, -0.15, -0.645]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[2.7, 1.7]} />
        <meshStandardMaterial
          color="#09090b"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      {/* Shiny LCD Screen Pane */}
      <mesh position={[0, -0.15, -0.655]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[2.5, 1.5]} />
        <meshStandardMaterial
          color="#030712"
          roughness={0.08}
          metalness={0.9}
        />
      </mesh>

      {/* 
        9. ADDITIONAL REALISTIC MECHANICAL CONTROLS & LUGS
      */}
      {/* Neck Strap eyelets (left & right sides of top plate) */}
      <group position={[1.71, 0.62, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
          <meshStandardMaterial color="#cfd2d6" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.045, 0.045, 0.06, 16]} />
          <meshStandardMaterial color="#09090b" roughness={0.8} />
        </mesh>
      </group>
      <group position={[-1.71, 0.62, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
          <meshStandardMaterial color="#cfd2d6" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.045, 0.045, 0.06, 16]} />
          <meshStandardMaterial color="#09090b" roughness={0.8} />
        </mesh>
      </group>

      {/* Front Self-Timer Red/Orange Lamp Indicator */}
      <group position={[0.72, 0.6, 0.63]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.02, 16]} />
          <meshStandardMaterial color="#0c0c0e" roughness={0.25} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.008, 16]} />
          <meshBasicMaterial color="#ea580c" /> {/* glowing amber bulb */}
        </mesh>
      </group>

      {/* Front Flash Sync Terminal Terminal Socket Cap */}
      <mesh position={[-0.45, 0.38, 0.63]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.03, 12]} />
        <meshStandardMaterial color="#09090b" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* Rear Textured Rubber Thumb Grip */}
      <RoundedBox
        args={[0.42, 0.55, 0.1]}
        radius={0.02}
        smoothness={3}
        position={[1.2, -0.05, -0.6]}
      >
        <meshStandardMaterial
          color="#121212"
          roughness={0.9}
          metalness={0.1}
          bumpMap={leatherTexture || undefined}
          bumpScale={0.02}
        />
      </RoundedBox>
    </group>
  );
}
