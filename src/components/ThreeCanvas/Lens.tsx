"use client";

import { useMemo, useState, useEffect } from "react";
import * as THREE from "three";
import { MeshTransmissionMaterial } from "@react-three/drei";

interface LensProps {
  lensRef: React.RefObject<THREE.Group | null>;
  frontGlassRef: React.RefObject<THREE.Mesh | null>;
  midGlass1Ref: React.RefObject<THREE.Mesh | null>;
  midGlass2Ref: React.RefObject<THREE.Mesh | null>;
  focusRingRef: React.RefObject<THREE.Group | null>;
  apertureGroupRef: React.RefObject<THREE.Group | null>;
}

export default function Lens({
  lensRef,
  frontGlassRef,
  midGlass1Ref,
  midGlass2Ref,
  focusRingRef,
  apertureGroupRef,
}: LensProps) {
  // Mobile detection for performance tuning
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Generate a procedural text engraving texture for the front bezel
  const textTexture = useMemo(() => {
    if (typeof window === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Dark metallic background
      ctx.fillStyle = "#111115";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Brass border lines
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

      // Engraved luxury lettering
      ctx.fillStyle = "#fbbf24"; // gold text
      ctx.font = "bold 32px var(--font-cinzel), Cinzel, Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "THE LENS   •   50mm f/1.2 L   •   MADE IN JAPAN   •   N° 832961",
        canvas.width / 2,
        canvas.height / 2
      );
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }, []);

  // Ribbed grip texture for zoom/focus rings (procedural normal-map style)
  const ribbedTexture = useMemo(() => {
    if (typeof window === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Draw alternating vertical bars to simulate ridges
      ctx.fillStyle = "#000000";
      for (let i = 0; i < canvas.width; i += 8) {
        ctx.fillRect(i, 0, 4, canvas.height);
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 1);
    return texture;
  }, []);

  // Aperture blade positions (6 blades arranged radially)
  const bladePositions = useMemo(() => {
    const blades = [];
    const numBlades = 6;
    for (let i = 0; i < numBlades; i++) {
      const angle = (i / numBlades) * Math.PI * 2;
      blades.push({
        angle,
        x: Math.cos(angle) * 0.45,
        y: Math.sin(angle) * 0.45,
      });
    }
    return blades;
  }, []);

  return (
    <group ref={lensRef} dispose={null}>
      {/* 
        MAIN LENS BARREL 
        Aligned along the Z-axis (facing camera).
        In Three.js, default cylinders lie along the Y-axis. 
        So we rotate them by Math.PI / 2 around the X-axis.
      */}

      {/* Front Bezel & Filter Thread */}
      <mesh position={[0, 0, 1.8]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.0, 2.1, 0.25, 64]} />
        <meshStandardMaterial color="#2d2d34" roughness={0.25} metalness={0.9} />
      </mesh>

      {/* Engraved Text ring */}
      {textTexture && (
        <mesh position={[0, 0, 1.68]} rotation={[Math.PI / 2, Math.PI, 0]}>
          <cylinderGeometry args={[1.98, 2.0, 0.12, 64, 1, true]} />
          <meshStandardMaterial map={textTexture} roughness={0.3} metalness={0.9} />
        </mesh>
      )}

      {/* Red Ring (Luxury Lens Accent) */}
      <mesh position={[0, 0, 1.6]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.02, 2.02, 0.05, 64]} />
        <meshStandardMaterial color="#dc2626" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Front Outer Casing */}
      <mesh position={[0, 0, 1.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.1, 2.15, 0.9, 64]} />
        <meshStandardMaterial color="#38383e" roughness={0.22} metalness={0.9} />
      </mesh>

      {/* Zoom / Focal Length Grip Ring */}
      <mesh position={[0, 0, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.16, 2.16, 0.4, 64]} />
        <meshStandardMaterial
          color="#1e1e24"
          roughness={0.35}
          metalness={0.6}
          bumpMap={ribbedTexture || undefined}
          bumpScale={0.09}
        />
      </mesh>

      {/* Middle Decorative Ring (Gold/Bronze) */}
      <mesh position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.17, 2.17, 0.1, 64]} />
        <meshStandardMaterial color="#d97706" roughness={0.2} metalness={1.0} />
      </mesh>

      {/* Focus Ring Group (will be rotated via ref in scene 3) */}
      <group ref={focusRingRef} position={[0, 0, -0.45]}>
        {/* Ribbed Grip */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[2.15, 2.15, 0.8, 64]} />
          <meshStandardMaterial
            color="#1e1e24"
            roughness={0.35}
            metalness={0.6}
            bumpMap={ribbedTexture || undefined}
            bumpScale={0.09}
          />
        </mesh>
        {/* Focus Distance Window Frame */}
        <mesh position={[0, 2.12, 0.1]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.6, 0.1, 0.3]} />
          <meshStandardMaterial color="#27272a" roughness={0.3} metalness={0.8} />
        </mesh>
      </group>

      {/* Rear Barrel Casing */}
      <mesh position={[0, 0, -1.25]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.1, 1.7, 0.8, 64]} />
        <meshStandardMaterial color="#38383e" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Metal Mount Flange (Back of Lens) */}
      <mesh position={[0, 0, -1.7]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.7, 1.7, 0.1, 64]} />
        <meshStandardMaterial color="#d4d4d8" roughness={0.15} metalness={1.0} />
      </mesh>


      {/* 
        INTERNAL APERTURE MECHANISM (Scene 7)
        Located deep inside the lens at Z = -0.5
      */}
      <group ref={apertureGroupRef} position={[0, 0, -0.6]}>
        {/* Aperture ring frame */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.2, 1.3, 0.05, 32, 1, true]} />
          <meshStandardMaterial color="#18181b" roughness={0.6} />
        </mesh>
        
        {/* Radially placed blades */}
        {bladePositions.map((blade, idx) => (
          <group key={idx} position={[blade.x, blade.y, 0]} rotation={[0, 0, blade.angle]}>
            <mesh position={[0.2, 0, 0]}>
              <planeGeometry args={[0.55, 0.25]} />
              <meshStandardMaterial
                color="#0c0c0e"
                roughness={0.7}
                metalness={0.4}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}
      </group>


      {/* 
        OPTICAL GLASS ELEMENTS
        Rendered with MeshTransmissionMaterial for luxury real-time refraction & chromatic aberration.
      */}

      {/* Front Glass Element (Double Convex) */}
      <mesh ref={frontGlassRef} position={[0, 0, 1.5]}>
        <sphereGeometry args={[1.88, 32, 16, 0, Math.PI * 2, 0, 0.45]} />
        <MeshTransmissionMaterial
          transmission={1.0}
          roughness={isMobile ? 0.05 : 0.02}
          thickness={1.2}
          ior={1.65}
          chromaticAberration={isMobile ? 0.0 : 0.08}
          anisotropy={0.2}
          distortion={0.25}
          distortionScale={0.2}
          temporalDistortion={0.0}
          color="#f0fdfa" // subtle cyan coating reflection
          {...(isMobile ? { samples: 2, resolution: 256 } : {})}
        />
      </mesh>

      {/* Internal Lens Element 1 (Double Concave / Mid Element) */}
      <mesh ref={midGlass1Ref} position={[0, 0, 0.7]}>
        <sphereGeometry args={[1.5, 32, 16, 0, Math.PI * 2, 0, 0.4]} />
        <MeshTransmissionMaterial
          transmission={1.0}
          roughness={isMobile ? 0.05 : 0.03}
          thickness={0.6}
          ior={1.52}
          chromaticAberration={isMobile ? 0.0 : 0.04}
          anisotropy={0.1}
          distortion={0.1}
          temporalDistortion={0.0}
          color="#f0fdf4" // green coating reflection
          {...(isMobile ? { samples: 2, resolution: 256 } : {})}
        />
      </mesh>

      {/* Internal Lens Element 2 (Convex / Rear Element) */}
      <mesh ref={midGlass2Ref} position={[0, 0, -0.3]}>
        <sphereGeometry args={[1.3, 32, 16, 0, Math.PI * 2, 0, 0.35]} />
        <MeshTransmissionMaterial
          transmission={1.0}
          roughness={isMobile ? 0.05 : 0.01}
          thickness={0.8}
          ior={1.62}
          chromaticAberration={isMobile ? 0.0 : 0.05}
          anisotropy={0.1}
          distortion={0.15}
          temporalDistortion={0.0}
          color="#f5f3ff" // purple coating reflection
          {...(isMobile ? { samples: 2, resolution: 256 } : {})}
        />
      </mesh>

      {/* Rear Element Cover Glass */}
      <mesh position={[0, 0, -1.6]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.05, 32]} />
        <meshPhysicalMaterial
          transmission={1.0}
          roughness={0.05}
          thickness={0.1}
          ior={1.5}
          color="#e0f2fe"
        />
      </mesh>
    </group>
  );
}
