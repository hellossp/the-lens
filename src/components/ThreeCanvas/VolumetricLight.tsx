"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Custom Volumetric Light Beam Shader
const VolumetricShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uFresnelPower;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    void main() {
      // Basic vertical fade (fades out at bottom and top)
      float verticalFade = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.4, vUv.y);
      
      // Fresnel effect: glow at grazing angles
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), uFresnelPower);
      
      // Radial UV fade
      float radialFade = sin(vUv.x * 3.14159);
      
      float finalAlpha = verticalFade * radialFade * (fresnel + 0.3) * uOpacity;
      
      gl_FragColor = vec4(uColor, finalAlpha);
    }
  `
};

interface VolumetricLightProps {
  lightBeamRef: React.RefObject<THREE.Mesh | null>;
  particlesRef: React.RefObject<THREE.Points | null>;
}

export default function VolumetricLight({ lightBeamRef, particlesRef }: VolumetricLightProps) {
  const beamMaterialRef = useRef<THREE.ShaderMaterial>(null);

  // Generate random positions and drift factors for dust particles
  const particleCount = 400;
  const [positions, driftFactors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const drift = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      // Random coordinates inside a bounding box around the camera viewport
      pos[i] = (Math.random() - 0.5) * 12; // X
      pos[i + 1] = (Math.random() - 0.5) * 12; // Y
      pos[i + 2] = (Math.random() - 0.5) * 15; // Z: distributed along camera tunnel

      // Drift speed/frequency factors
      drift[i] = Math.random();
      drift[i + 1] = Math.random();
      drift[i + 2] = Math.random();
    }
    return [pos, drift];
  }, []);

  // Animate dust particles to float organically
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const points = particlesRef.current;
    if (!points) return;

    const posAttr = points.geometry.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const factorX = driftFactors[idx];
      const factorY = driftFactors[idx + 1];
      const factorZ = driftFactors[idx + 2];

      // Sinusoidal drifting
      array[idx] += Math.sin(time * 0.2 + factorX * 10) * 0.002; // drift X
      array[idx + 1] += Math.cos(time * 0.15 + factorY * 10) * 0.003; // drift Y
      array[idx + 2] += Math.sin(time * 0.1 + factorZ * 10) * 0.002; // drift Z

      // Wrap-around boundary check
      if (array[idx] > 6) array[idx] = -6;
      if (array[idx] < -6) array[idx] = 6;
      if (array[idx + 1] > 6) array[idx + 1] = -6;
      if (array[idx + 1] < -6) array[idx + 1] = 6;
      if (array[idx + 2] > 7) array[idx + 2] = -8;
      if (array[idx + 2] < -8) array[idx + 2] = 7;
    }

    posAttr.needsUpdate = true;
    
    // Slow rotational drift of particle field
    points.rotation.y = time * 0.008;
    points.rotation.z = time * 0.005;
  });

  return (
    <group>
      {/* 
        Volumetric light cone/beam 
        Positioned slightly behind the lens front element, extending down
      */}
      <mesh
        ref={lightBeamRef}
        position={[0, 0, -2]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[1.5, 6, 1.5]}
      >
        <cylinderGeometry args={[0.8, 1.8, 2, 32, 1, true]} />
        <shaderMaterial
          ref={beamMaterialRef}
          vertexShader={VolumetricShader.vertexShader}
          fragmentShader={VolumetricShader.fragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{
            uColor: { value: new THREE.Color("#fbbf24") }, // warm golden light
            uOpacity: { value: 0.0 }, // controlled by GSAP ScrollTrigger
            uFresnelPower: { value: 2.0 }
          }}
        />
      </mesh>

      {/* Auxiliary cooler/blue light beam for color depth */}
      <mesh
        position={[0.2, -0.2, -1.8]}
        rotation={[Math.PI / 2.1, 0.1, 0.1]}
        scale={[1.2, 5.5, 1.2]}
      >
        <cylinderGeometry args={[0.5, 1.5, 2, 32, 1, true]} />
        <shaderMaterial
          vertexShader={VolumetricShader.vertexShader}
          fragmentShader={VolumetricShader.fragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{
            uColor: { value: new THREE.Color("#38bdf8") }, // cyan accent light
            // Simple bound to the primary beam ref so it animates in sync
            uOpacity: {
              get value() {
                return (beamMaterialRef.current?.uniforms.uOpacity.value ?? 0) * 0.4;
              },
              set value(val) {}
            },
            uFresnelPower: { value: 2.5 }
          }}
        />
      </mesh>

      {/* Floating Dust Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color="#fef08a" // warm dust color
          transparent
          opacity={0.0} // animated by GSAP
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
