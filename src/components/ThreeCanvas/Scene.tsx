"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lens from "./Lens";
import CameraBody from "./CameraBody";
import VolumetricLight from "./VolumetricLight";

gsap.registerPlugin(ScrollTrigger);

export default function Scene() {
  // 3D Refs
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const lensGroupRef = useRef<THREE.Group>(null);
  const lensModelRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);

  const frontGlassRef = useRef<THREE.Mesh>(null);
  const midGlass1Ref = useRef<THREE.Mesh>(null);
  const midGlass2Ref = useRef<THREE.Mesh>(null);
  const focusRingRef = useRef<THREE.Group>(null);
  const apertureGroupRef = useRef<THREE.Group>(null);

  const lightBeamRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Mouse coordinates for gentle parallax effect
  const mouse = useRef({ x: 0, y: 0 });

  // Base rotation animated by GSAP, while useFrame adds idle sways & spin on top
  const baseRotation = useRef({ x: 0.25, y: -0.4, z: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) - 0.5;
      mouse.current.y = (e.clientY / window.innerHeight) - 0.5;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Frame loop for idle rotations and mouse parallax
  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // 1. Apply base rotation + slow Z-spin + idle floating sways to the camera system
    if (lensGroupRef.current) {
      lensGroupRef.current.rotation.x = baseRotation.current.x + Math.sin(time * 0.15) * 0.02;
      lensGroupRef.current.rotation.y = baseRotation.current.y + Math.cos(time * 0.1) * 0.02;
      lensGroupRef.current.rotation.z = baseRotation.current.z + time * 0.03;
    }

    // 2. Camera mouse parallax
    if (cameraRef.current) {
      const targetX = mouse.current.x * 0.4;
      const targetY = -mouse.current.y * 0.4;
      
      // Only apply camera parallax when not inside/behind the lens casing
      if (cameraRef.current.position.z > 1.2) {
        cameraRef.current.position.x = THREE.MathUtils.lerp(cameraRef.current.position.x, targetX, 0.05);
        cameraRef.current.position.y = THREE.MathUtils.lerp(cameraRef.current.position.y, targetY, 0.05);
        cameraRef.current.lookAt(0, 0, 0);
      } else {
        cameraRef.current.position.x = THREE.MathUtils.lerp(cameraRef.current.position.x, 0, 0.08);
        cameraRef.current.position.y = THREE.MathUtils.lerp(cameraRef.current.position.y, 0, 0.08);
        cameraRef.current.lookAt(0, 0, -2);
      }
    }
  });

  // Orchestrate ScrollTrigger timeline
  useEffect(() => {
    if (
      !cameraRef.current ||
      !lensGroupRef.current ||
      !lensModelRef.current ||
      !bodyRef.current ||
      !frontGlassRef.current ||
      !midGlass1Ref.current ||
      !midGlass2Ref.current ||
      !focusRingRef.current ||
      !apertureGroupRef.current ||
      !lightBeamRef.current ||
      !particlesRef.current
    ) {
      return;
    }

    const beamMaterial = lightBeamRef.current.material as THREE.ShaderMaterial;
    const particlesMaterial = particlesRef.current.material as THREE.PointsMaterial;

    // Reset Camera Body state
    bodyRef.current.scale.set(0.001, 0.001, 0.001);
    bodyRef.current.position.set(0, -0.2, -2.36); // standard snapped position relative to lensGroupRef

    // Master GSAP Timeline linked to scroll progress
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#scroll-container",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2,
      },
    });

    // ----------------------------------------------------
    // SCENE 1: THE LENS (Scroll: 0% -> 15%, Timeline 0 -> 1.5)
    // Lens centered and tilted dynamically to show edges and metallic textures
    // ----------------------------------------------------
    tl.to(cameraRef.current.position, {
      z: 4.5, // keep camera at a nice distance to see full lens profile
      ease: "power1.inOut",
      duration: 1.5,
    }, 0);

    tl.to(baseRotation.current, {
      x: 0.15,
      y: 0.8, // rotate to show the detailed side textures
      z: 0.2,
      duration: 1.5,
      ease: "power2.inOut",
    }, 0);

    // HTML Text Scene 1
    tl.to(".text-scene-1", { opacity: 1, y: 0, duration: 0.5 }, 0);
    tl.to(".text-scene-1", { opacity: 0, y: -40, duration: 0.5 }, 1.0);

    // ----------------------------------------------------
    // SCENE 2: THE LIGHT (Scroll: 15% -> 30%, Timeline 1.5 -> 3.0)
    // Lens travels to the left, and a volumetric beam shoots through it
    // ----------------------------------------------------
    tl.to(lensGroupRef.current.position, {
      x: -1.0,
      y: 0.1,
      z: 0.3,
      duration: 1.5,
      ease: "power2.inOut",
    }, 1.5);

    tl.to(baseRotation.current, {
      x: 0.1,
      y: -0.6, // tilt to align the glass refraction in light direction
      z: 0.0,
      duration: 1.5,
      ease: "power2.inOut",
    }, 1.5);

    // Fade in volumetric beam
    tl.to(beamMaterial.uniforms.uOpacity, {
      value: 0.85,
      duration: 1.0,
      ease: "power1.out",
    }, 1.8);

    // Fade in dust particles
    tl.to(particlesMaterial, {
      opacity: 0.8,
      duration: 1.2,
      ease: "power1.out",
    }, 1.8);

    // HTML Text Scene 2
    tl.to(".text-scene-2", { opacity: 1, y: 0, duration: 0.5 }, 1.5);
    tl.to(".text-scene-2", { opacity: 0, y: -40, duration: 0.5 }, 2.5);

    // ----------------------------------------------------
    // SCENE 3: THE FOCUS (Scroll: 30% -> 50%, Timeline 3.0 -> 5.0)
    // Lens travels to the right, focus ring rotates, and glass elements separate
    // ----------------------------------------------------
    tl.to(lensGroupRef.current.position, {
      x: 1.1,
      y: -0.1,
      z: -0.4,
      duration: 2.0,
      ease: "power2.inOut",
    }, 3.0);

    tl.to(baseRotation.current, {
      x: 0.3,
      y: 0.6, // opposite tilt to show separated layers in perspective
      z: -0.2,
      duration: 2.0,
      ease: "power2.inOut",
    }, 3.0);

    // Move front glass forward
    tl.to(frontGlassRef.current.position, {
      z: 2.3,
      duration: 2.0,
      ease: "power2.inOut",
    }, 3.0);

    // Move internal elements backward
    tl.to(midGlass1Ref.current.position, {
      z: 0.1,
      duration: 2.0,
      ease: "power2.inOut",
    }, 3.0);

    tl.to(midGlass2Ref.current.position, {
      z: -1.0,
      duration: 2.0,
      ease: "power2.inOut",
    }, 3.0);

    // Rotate focus ring
    tl.to(focusRingRef.current.rotation, {
      z: Math.PI * 1.8,
      duration: 2.0,
      ease: "power2.inOut",
    }, 3.0);

    // Fade volumetric light slightly during focus transition
    tl.to(beamMaterial.uniforms.uOpacity, {
      value: 0.35,
      duration: 1.0,
    }, 3.0);

    // HTML Text Scene 3
    tl.to(".text-scene-3", { opacity: 1, y: 0, duration: 0.6 }, 3.0);
    tl.to(".text-scene-3", { opacity: 0, y: -40, duration: 0.6 }, 4.4);

    // ----------------------------------------------------
    // SCENE 4: THE MEMORY / SHUTTER snaps (Scroll: 50% -> 70%, Timeline 5.0 -> 7.0)
    // Lens reassembles at center, aperture blades close and open rapidly (camera snaps)
    // ----------------------------------------------------
    tl.to(lensGroupRef.current.position, {
      x: 0.0,
      y: 0.0,
      z: 0.0,
      duration: 1.5,
      ease: "power2.inOut",
    }, 5.0);

    tl.to(baseRotation.current, {
      x: 0.0,
      y: 0.0,
      z: 0.0,
      duration: 1.5,
      ease: "power2.inOut",
    }, 5.0);

    // Reassemble glass elements
    tl.to(frontGlassRef.current.position, { z: 1.5, duration: 1.2, ease: "power2.inOut" }, 5.0);
    tl.to(midGlass1Ref.current.position, { z: 0.7, duration: 1.2, ease: "power2.inOut" }, 5.0);
    tl.to(midGlass2Ref.current.position, { z: -0.3, duration: 1.2, ease: "power2.inOut" }, 5.0);
    tl.to(focusRingRef.current.rotation, { z: 0, duration: 1.2, ease: "power2.inOut" }, 5.0);

    // Dynamic focus breathe + aperture snap (rapid close & reopen)
    tl.to(apertureGroupRef.current.rotation, {
      z: Math.PI / 1.5,
      duration: 0.6,
      ease: "power1.inOut",
    }, 5.8);
    tl.to(apertureGroupRef.current.scale, {
      x: 0.15,
      y: 0.15,
      z: 0.15,
      duration: 0.6,
      ease: "power1.inOut",
    }, 5.8);

    tl.to(apertureGroupRef.current.rotation, {
      z: 0,
      duration: 0.6,
      ease: "power1.inOut",
    }, 6.4);
    tl.to(apertureGroupRef.current.scale, {
      x: 1.0,
      y: 1.0,
      z: 1.0,
      duration: 0.6,
      ease: "power1.inOut",
    }, 6.4);

    // HTML Text Scene 4
    tl.to(".text-scene-4", { opacity: 1, y: 0, duration: 0.5 }, 5.0);
    tl.to(".text-scene-4", { opacity: 0, y: -40, duration: 0.5 }, 6.5);

    // ----------------------------------------------------
    // SCENE 5: THE GALLERY CAMERA ASSEMBLY (Scroll: 70% -> 85%, Timeline 7.0 -> 9.5)
    // Camera body scales up in center, lens slides forward, rotates and snaps back to lock!
    // ----------------------------------------------------
    // Scale camera body up and make it visible
    tl.to(bodyRef.current.scale, {
      x: 1.0,
      y: 1.0,
      z: 1.0,
      duration: 1.5,
      ease: "back.out(1.1)",
    }, 7.0);

    // Push lens forward and rotate to twist-lock insertion angle
    tl.to(lensModelRef.current.position, {
      z: 1.8,
      duration: 0.8,
      ease: "power1.out",
    }, 7.0);
    tl.to(lensModelRef.current.rotation, {
      z: -0.8, // rotation angle for bayonet insertion
      duration: 0.8,
      ease: "power1.out",
    }, 7.0);

    // SNAP! Slide lens back onto mount and twist to lock
    tl.to(lensModelRef.current.position, {
      z: 0.0,
      duration: 1.0,
      ease: "back.inOut(1.2)",
    }, 7.8);
    tl.to(lensModelRef.current.rotation, {
      z: 0.0, // twist lock back to straight
      duration: 1.0,
      ease: "back.inOut(1.2)",
    }, 7.8);

    // Zoom camera slightly closer to see the final snap details
    tl.to(cameraRef.current.position, {
      z: 4.8,
      duration: 1.5,
      ease: "power2.inOut",
    }, 7.0);

    // Tilt camera towards user for a majestic assembled view
    tl.to(baseRotation.current, {
      x: 0.2,
      y: -0.4,
      duration: 1.5,
      ease: "power2.inOut",
    }, 8.0);

    // Fade out light beams & dust
    tl.to(beamMaterial.uniforms.uOpacity, { value: 0.0, duration: 1.0 }, 7.0);
    tl.to(particlesMaterial, { opacity: 0.0, duration: 1.0 }, 7.0);

    // HTML Text Scene 5
    tl.to(".text-scene-5", { opacity: 1, y: 0, pointerEvents: "auto", duration: 0.5 }, 7.0);
    tl.to(".text-scene-5", { opacity: 0, y: -40, pointerEvents: "none", duration: 0.5 }, 9.5);

    // ----------------------------------------------------
    // SCENE 6: THE LEGACY (Scroll: 85% -> 93%, Timeline 9.5 -> 11.5)
    // Assembled Camera drifts to bottom-left, leaving space for HTML legacy photo on right
    // ----------------------------------------------------
    tl.to(lensGroupRef.current.position, {
      x: -1.3,
      y: -0.6,
      z: -1.2,
      duration: 1.5,
      ease: "power2.inOut",
    }, 9.5);

    tl.to(baseRotation.current, {
      x: 0.15,
      y: -0.2,
      z: 0.0,
      duration: 1.5,
      ease: "power2.inOut",
    }, 9.5);

    // Zoom camera slightly closer
    tl.to(cameraRef.current.position, {
      z: 3.5,
      duration: 1.5,
      ease: "power2.inOut",
    }, 9.5);

    // HTML Text Scene 6
    tl.to(".text-scene-6", { opacity: 1, y: 0, duration: 0.5 }, 9.5);
    tl.to(".text-scene-6", { opacity: 0, y: -40, duration: 0.5 }, 11.0);

    // ----------------------------------------------------
    // SCENE 7: CTA / BOOKING (Scroll: 93% -> 100%, Timeline 11.5 -> 13.0)
    // Camera returns to center and closes aperture (shutter close outro)
    // ----------------------------------------------------
    // Return camera system to center
    tl.to(lensGroupRef.current.position, {
      x: 0.0,
      y: 0.0,
      z: 0.0,
      duration: 1.5,
      ease: "power2.inOut",
    }, 11.5);

    tl.to(baseRotation.current, {
      x: 0.0,
      y: 0.0,
      z: 0.0,
      duration: 1.5,
      ease: "power2.inOut",
    }, 11.5);

    // Pull camera back
    tl.to(cameraRef.current.position, {
      z: 5.0,
      duration: 1.5,
      ease: "power2.inOut",
    }, 11.5);

    // Close aperture blades (rotate + scale group down)
    tl.to(apertureGroupRef.current.rotation, {
      z: Math.PI / 1.5,
      duration: 1.2,
      ease: "power2.inOut",
    }, 11.8);

    tl.to(apertureGroupRef.current.scale, {
      x: 0.15,
      y: 0.15,
      z: 0.15,
      duration: 1.2,
      ease: "power2.inOut",
    }, 11.8);

    // Fade camera out to pure blackness at the very end
    tl.to(lensGroupRef.current.scale, {
      x: 0.0,
      y: 0.0,
      z: 0.0,
      duration: 0.8,
      ease: "power2.in",
    }, 12.4);

    // HTML Text Scene 7 (Booking Form fade in)
    tl.to(".text-scene-7", { opacity: 1, y: 0, pointerEvents: "auto", duration: 0.8 }, 11.5);

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={45}
        near={0.1}
        far={50}
        position={[0, 0, 5.0]} // Initial camera position (Scene 1)
      />

      {/* Cinematic Viewport Lighting */}
      <ambientLight intensity={0.08} />
      
      {/* Dynamic key light (warm, gold highlights) */}
      <directionalLight
        position={[6, 8, 5]}
        intensity={2.2}
        color="#fef08a"
        castShadow
      />
      
      {/* Dynamic rim light (cool blue highlights along casing edges) */}
      <directionalLight
        position={[-6, 4, -4]}
        intensity={3.5}
        color="#e0f2fe"
      />

      {/* Internal glow point light */}
      <pointLight
        position={[0, 0, 0.5]}
        intensity={1.5}
        distance={6}
        color="#fbbf24"
      />

      {/* 
        Nested Camera System:
        Nesting CameraBody inside the lensGroupRef group ensures they pivot 
        together seamlessly as a single solid unit during mouse-parallax and rotations.
        Raycasting onClick dispatches the camera-shutter click event.
      */}
      <group
        ref={lensGroupRef}
        onClick={(e) => {
          e.stopPropagation();
          // Only allow camera click actions once the camera body starts scaling up (Scene 5+)
          if (bodyRef.current && bodyRef.current.scale.x > 0.5) {
            window.dispatchEvent(new CustomEvent("camera-shutter"));
          }
        }}
      >
        {/* Procedural 3D Camera Lens */}
        <Lens
          lensRef={lensModelRef}
          frontGlassRef={frontGlassRef}
          midGlass1Ref={midGlass1Ref}
          midGlass2Ref={midGlass2Ref}
          focusRingRef={focusRingRef}
          apertureGroupRef={apertureGroupRef}
        />

        {/* 3D Camera Body (slides in on Z from background during assembly) */}
        <CameraBody bodyRef={bodyRef} />

        {/* Inside-the-lens effects: Volumetric Light & Dust */}
        <VolumetricLight
          lightBeamRef={lightBeamRef}
          particlesRef={particlesRef}
        />
      </group>
    </>
  );
}

