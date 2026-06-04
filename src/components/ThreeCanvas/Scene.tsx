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

  // Local rotation of the dial driven by button clicks
  const dialRotationY = useRef(0);
  const targetIndexRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) - 0.5;
      mouse.current.y = (e.clientY / window.innerHeight) - 0.5;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Listen to interactive dial-change events for button-driven 3D lens rotation
  useEffect(() => {
    const handleDialChange = (e: Event) => {
      targetIndexRef.current = (e as CustomEvent).detail.index;
    };
    window.addEventListener("dial-change", handleDialChange);
    return () => window.removeEventListener("dial-change", handleDialChange);
  }, []);

  // Frame loop for idle rotations and mouse parallax
  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Calculate scroll progress to determine whether we are inside Scene 4 (Capabilities)
    let progress = 0;
    if (typeof window !== "undefined") {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      progress = docHeight > 0 ? window.scrollY / docHeight : 0;
    }

    // Target dial rotation matches the selected service idx when inside Capabilities (0.44 to 0.62)
    // Outside this range, the dial rotation smoothly resets to 0 (e.g. for assembly/lock in Scene 5)
    const targetRotation = (progress >= 0.44 && progress <= 0.62)
      ? -targetIndexRef.current * (Math.PI * 0.5 / 7)
      : 0;

    // Smoothly interpolate the local dial rotation ref
    dialRotationY.current = THREE.MathUtils.lerp(dialRotationY.current, targetRotation, 0.08);

    // 1. Apply base rotation + slow Z-spin + dial rotation + idle floating sways to the camera system
    if (lensGroupRef.current) {
      lensGroupRef.current.rotation.x = baseRotation.current.x + Math.sin(time * 0.15) * 0.02;
      lensGroupRef.current.rotation.y = baseRotation.current.y + dialRotationY.current + Math.cos(time * 0.1) * 0.02;
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

  // Listen to interactive shutter click events for real-time mechanical 3D feedback
  useEffect(() => {
    const handleInteractiveShutter = () => {
      if (apertureGroupRef.current) {
        gsap.timeline()
          .to(apertureGroupRef.current.rotation, { z: Math.PI / 1.5, duration: 0.15, ease: "power1.inOut" })
          .to(apertureGroupRef.current.scale, { x: 0.15, y: 0.15, z: 0.15, duration: 0.15, ease: "power1.inOut" }, 0)
          .to(apertureGroupRef.current.rotation, { z: 0, duration: 0.15, ease: "power1.inOut" })
          .to(apertureGroupRef.current.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.15, ease: "power1.inOut" }, ">");
      }
    };
    window.addEventListener("camera-shutter", handleInteractiveShutter);
    return () => window.removeEventListener("camera-shutter", handleInteractiveShutter);
  }, []);

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

    // Local shutter sound synthesizer for dial snaps (throttled)
    let lastClickTime = 0;
    const playShutterSound = () => {
      if (typeof window === "undefined") return;
      const now = Date.now();
      if (now - lastClickTime < 120) return;
      lastClickTime = now;
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const bufferSize = ctx.sampleRate * 0.08;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;
        
        const bandpass = ctx.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.frequency.value = 1400;
        bandpass.Q.value = 4;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.35, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
        
        noiseSource.connect(bandpass);
        bandpass.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        noiseSource.start();
      } catch (err) {
        // silence errors
      }
    };

    // Register custom 8-detents snap ease
    gsap.registerEase("detent-8", (progress: number) => {
      return progress - Math.sin(14 * Math.PI * progress) / (14 * Math.PI);
    });

    // Master GSAP Timeline linked to scroll progress (now scaled to 14.0s duration)
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#scroll-container",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2,
      },
    });

    // ----------------------------------------------------
    // SCENE 1: THE LENS (Scroll: 0% -> 12.8%, Timeline 0 -> 1.8)
    // Lens centered and tilted dynamically to show edges and metallic textures
    // ----------------------------------------------------
    tl.to(cameraRef.current.position, {
      z: 4.5, // keep camera at a nice distance to see full lens profile
      ease: "power1.inOut",
      duration: 1.8,
    }, 0);

    tl.to(baseRotation.current, {
      x: 0.15,
      y: 0.8, // rotate to show the detailed side textures
      z: 0.2,
      duration: 1.8,
      ease: "power2.inOut",
    }, 0);

    // HTML Text Scene 1
    tl.set(".text-scene-1", { display: "flex" }, 0);
    tl.to(".text-scene-1", { opacity: 1, y: 0, duration: 0.6 }, 0);
    tl.to(".text-scene-1", { opacity: 0, y: -40, duration: 0.6 }, 1.2);
    tl.set(".text-scene-1", { display: "none" }, 1.8);

    // ----------------------------------------------------
    // SCENE 2: THE LIGHT (Scroll: 12.8% -> 25.7%, Timeline 1.8 -> 3.6)
    // Lens travels to the left, and a volumetric beam shoots through it
    // ----------------------------------------------------
    tl.to(lensGroupRef.current.position, {
      x: -1.0,
      y: 0.1,
      z: 0.3,
      duration: 1.8,
      ease: "power2.inOut",
    }, 1.8);

    tl.to(baseRotation.current, {
      x: 0.1,
      y: -0.6, // tilt to align the glass refraction in light direction
      z: 0.0,
      duration: 1.8,
      ease: "power2.inOut",
    }, 1.8);

    // Fade in volumetric beam
    tl.to(beamMaterial.uniforms.uOpacity, {
      value: 0.85,
      duration: 1.2,
      ease: "power1.out",
    }, 2.1);

    // Fade in dust particles
    tl.to(particlesMaterial, {
      opacity: 0.8,
      duration: 1.4,
      ease: "power1.out",
    }, 2.1);

    // HTML Text Scene 2
    tl.set(".text-scene-2", { display: "flex" }, 1.8);
    tl.to(".text-scene-2", { opacity: 1, y: 0, duration: 0.6 }, 1.8);
    tl.to(".text-scene-2", { opacity: 0, y: -40, duration: 0.6 }, 3.0);
    tl.set(".text-scene-2", { display: "none" }, 3.6);

    // ----------------------------------------------------
    // SCENE 3: THE FOCUS (Scroll: 25.7% -> 41.4%, Timeline 3.6 -> 5.8)
    // Lens travels to the right, focus ring rotates, and glass elements separate
    // ----------------------------------------------------
    tl.to(lensGroupRef.current.position, {
      x: 1.1,
      y: -0.1,
      z: -0.4,
      duration: 2.2,
      ease: "power2.inOut",
    }, 3.6);

    tl.to(baseRotation.current, {
      x: 0.3,
      y: 0.6, // opposite tilt to show separated layers in perspective
      z: -0.2,
      duration: 2.2,
      ease: "power2.inOut",
    }, 3.6);

    // Move front glass forward
    tl.to(frontGlassRef.current.position, {
      z: 2.3,
      duration: 2.2,
      ease: "power2.inOut",
    }, 3.6);

    // Move internal elements backward
    tl.to(midGlass1Ref.current.position, {
      z: 0.1,
      duration: 2.2,
      ease: "power2.inOut",
    }, 3.6);

    tl.to(midGlass2Ref.current.position, {
      z: -1.0,
      duration: 2.2,
      ease: "power2.inOut",
    }, 3.6);

    // Rotate focus ring
    tl.to(focusRingRef.current.rotation, {
      z: Math.PI * 1.8,
      duration: 2.2,
      ease: "power2.inOut",
    }, 3.6);

    // Fade volumetric light slightly during focus transition
    tl.to(beamMaterial.uniforms.uOpacity, {
      value: 0.35,
      duration: 1.2,
    }, 3.6);

    // HTML Text Scene 3
    tl.set(".text-scene-3", { display: "flex" }, 3.6);
    tl.to(".text-scene-3", { opacity: 1, y: 0, duration: 0.7 }, 3.6);
    tl.to(".text-scene-3", { opacity: 0, y: -40, duration: 0.7 }, 5.1);
    tl.set(".text-scene-3", { display: "none" }, 5.8);

    // ----------------------------------------------------
    // SCENE 4: CAPABILITIES / SERVICES (Scroll: 41.4% -> 61.4%, Timeline 5.8 -> 8.6)
    // Lens reassembles in center, and spins in sync with dial rotation
    // ----------------------------------------------------
    tl.to(lensGroupRef.current.position, {
      x: 0.0,
      y: 0.0,
      z: 0.0,
      duration: 1.2,
      ease: "power2.inOut",
    }, 5.8);

    // Reassemble glass elements
    tl.to(frontGlassRef.current.position, { z: 1.5, duration: 1.2, ease: "power2.inOut" }, 5.8);
    tl.to(midGlass1Ref.current.position, { z: 0.7, duration: 1.2, ease: "power2.inOut" }, 5.8);
    tl.to(midGlass2Ref.current.position, { z: -0.3, duration: 1.2, ease: "power2.inOut" }, 5.8);
    tl.to(focusRingRef.current.rotation, { z: 0, duration: 1.2, ease: "power2.inOut" }, 5.8);

    // Dynamic rotation of 3D lens Y-axis in sync with the dial rotation
    // We orient it to a static starting position (-Math.PI * 0.8) during Scene 4
    tl.to(baseRotation.current, {
      x: 0.05,
      y: -Math.PI * 0.8,
      z: 0.0,
      duration: 1.2,
      ease: "power2.inOut",
    }, 5.8);

    // HTML Text Capabilities Container Fade In/Out
    tl.set(".text-scene-services", { display: "flex" }, 5.8);
    tl.to(".text-scene-services", { opacity: 1, y: 0, duration: 0.6 }, 5.8);
    tl.to(".text-scene-services", { opacity: 0, y: -40, duration: 0.4 }, 8.6);
    tl.set(".text-scene-services", { display: "none" }, 9.0);

    // ----------------------------------------------------
    // SCENE 5: THE GALLERY CAMERA ASSEMBLY (Scroll: 61.4% -> 78.6%, Timeline 8.6 -> 11.0)
    // Camera body scales up in center, lens slides forward, rotates and snaps back to lock!
    // ----------------------------------------------------
    // Scale camera body up and make it visible
    tl.to(bodyRef.current.scale, {
      x: 1.0,
      y: 1.0,
      z: 1.0,
      duration: 1.5,
      ease: "back.out(1.1)",
    }, 8.6);

    // Push lens forward and rotate to twist-lock insertion angle
    tl.to(lensModelRef.current.position, {
      z: 1.8,
      duration: 0.8,
      ease: "power1.out",
    }, 8.6);
    tl.to(lensModelRef.current.rotation, {
      z: -0.8, // rotation angle for bayonet insertion
      duration: 0.8,
      ease: "power1.out",
    }, 8.6);

    // SNAP! Slide lens back onto mount and twist to lock
    tl.to(lensModelRef.current.position, {
      z: 0.0,
      duration: 1.0,
      ease: "back.inOut(1.2)",
    }, 9.4);
    tl.to(lensModelRef.current.rotation, {
      z: 0.0, // twist lock back to straight
      duration: 1.0,
      ease: "back.inOut(1.2)",
    }, 9.4);

    // Zoom camera slightly closer to see the final snap details
    tl.to(cameraRef.current.position, {
      z: 4.8,
      duration: 1.5,
      ease: "power2.inOut",
    }, 8.6);

    // Tilt camera towards user for a majestic assembled view
    tl.to(baseRotation.current, {
      x: 0.2,
      y: -0.4,
      duration: 1.2,
      ease: "power2.inOut",
    }, 9.6);

    // Fade out light beams & dust
    tl.to(beamMaterial.uniforms.uOpacity, { value: 0.0, duration: 1.0 }, 8.6);
    tl.to(particlesMaterial, { opacity: 0.0, duration: 1.0 }, 8.6);

    // HTML Text Scene 5
    tl.set(".text-scene-5", { display: "flex" }, 8.6);
    tl.to(".text-scene-5", { opacity: 1, y: 0, duration: 0.5 }, 8.6);
    tl.to(".text-scene-5", { opacity: 0, y: -40, duration: 0.5 }, 10.4);
    tl.set(".text-scene-5", { display: "none" }, 11.0);

    // ----------------------------------------------------
    // SCENE 6: THE LEGACY (Scroll: 78.6% -> 90.0%, Timeline 11.0 -> 12.6)
    // Assembled Camera drifts to bottom-left with ultra-smooth easing (sine.inOut)
    // ----------------------------------------------------
    tl.to(lensGroupRef.current.position, {
      x: -1.3,
      y: -0.6,
      z: -1.2,
      duration: 1.6,
      ease: "sine.inOut", // Ultra-smooth drift easing
    }, 11.0);

    tl.to(baseRotation.current, {
      x: 0.15,
      y: -0.2,
      z: 0.0,
      duration: 1.6,
      ease: "sine.inOut",
    }, 11.0);

    // Zoom camera slightly closer
    tl.to(cameraRef.current.position, {
      z: 3.5,
      duration: 1.6,
      ease: "sine.inOut",
    }, 11.0);

    // HTML Text Scene 6
    tl.set(".text-scene-6", { display: "flex" }, 11.0);
    tl.to(".text-scene-6", { opacity: 1, y: 0, duration: 0.5 }, 11.0);
    tl.to(".text-scene-6", { opacity: 0, y: -40, duration: 0.5 }, 12.2);
    tl.set(".text-scene-6", { display: "none" }, 12.7);

    // ----------------------------------------------------
    // SCENE 7: CTA / BOOKING (Scroll: 90.0% -> 100%, Timeline 12.6 -> 14.0)
    // Camera returns to center and closes aperture (shutter close outro)
    // ----------------------------------------------------
    // Return camera system to center
    tl.to(lensGroupRef.current.position, {
      x: 0.0,
      y: 0.0,
      z: 0.0,
      duration: 1.2,
      ease: "power2.inOut",
    }, 12.6);

    tl.to(baseRotation.current, {
      x: 0.0,
      y: 0.0,
      z: 0.0,
      duration: 1.2,
      ease: "power2.inOut",
    }, 12.6);

    // Pull camera back
    tl.to(cameraRef.current.position, {
      z: 5.0,
      duration: 1.2,
      ease: "power2.inOut",
    }, 12.6);

    // Close aperture blades (rotate + scale group down)
    tl.to(apertureGroupRef.current.rotation, {
      z: Math.PI / 1.5,
      duration: 1.0,
      ease: "power2.inOut",
    }, 12.8);

    tl.to(apertureGroupRef.current.scale, {
      x: 0.15,
      y: 0.15,
      z: 0.15,
      duration: 1.0,
      ease: "power2.inOut",
    }, 12.8);

    // Fade camera out to pure blackness at the very end
    tl.to(lensGroupRef.current.scale, {
      x: 0.0,
      y: 0.0,
      z: 0.0,
      duration: 0.8,
      ease: "power2.in",
    }, 13.0);

    // HTML Text Scene 7 (Booking Form fade in)
    tl.set(".text-scene-7", { display: "flex" }, 12.6);
    tl.to(".text-scene-7", { opacity: 1, y: 0, duration: 0.8 }, 12.6);

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
