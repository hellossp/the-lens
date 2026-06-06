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
  const responsiveWrapperRef = useRef<THREE.Group>(null);
  const lensGroupRef = useRef<THREE.Group>(null);
  const lensModelRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);

  const frontGlassRef = useRef<THREE.Mesh>(null);
  const midGlass1Ref = useRef<THREE.Mesh>(null);
  const midGlass2Ref = useRef<THREE.Mesh>(null);
  const focusRingRef = useRef<THREE.Group>(null);
  const apertureGroupRef = useRef<THREE.Group>(null);
  const flareRef = useRef<THREE.Mesh>(null);

  const lightBeamRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);

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

    // Dynamic responsive scaling for the wrapper group
    if (responsiveWrapperRef.current) {
      // Calculate responsive scale based on viewport width (standard desktop width is ~8 units)
      // On narrow mobile viewports, we scale down the 3D elements to prevent clipping.
      let scale = 1.0;
      let yOffset = 0.0;
      
      if (state.viewport.width < 6.0) {
        scale = Math.min(1.0, state.viewport.width / 5.8);
        // Push slightly upwards on mobile so it is not covered by stacked cards/text below it
        yOffset = 0.3;
      }
      
      responsiveWrapperRef.current.scale.setScalar(scale);
      responsiveWrapperRef.current.position.y = yOffset;
    }

    // Target dial rotation matches the selected service idx when inside Capabilities (0.44 to 0.58)
    // Outside this range, the dial rotation smoothly resets to 0 (e.g. for assembly/lock in Scene 5)
    const targetRotation = (progress >= 0.44 && progress <= 0.58)
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
      !particlesRef.current ||
      !flareRef.current
    ) {
      return;
    }

    const beamMaterial = lightBeamRef.current.material as THREE.ShaderMaterial;
    const particlesMaterial = particlesRef.current.material as THREE.PointsMaterial;

    // Scale lens model down to 0.48 for realistic camera-to-lens proportions
    if (lensModelRef.current) {
      lensModelRef.current.scale.setScalar(0.48);
    }

    // Reset Camera Body state
    bodyRef.current.scale.set(0.001, 0.001, 0.001);
    bodyRef.current.position.set(0, 0.15, -1.76); // standard snapped position aligned to lens mount

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
      value: 0.45,
      duration: 1.2,
      ease: "power1.out",
    }, 1.6);

    // Fade in dust particles
    tl.to(particlesMaterial, {
      opacity: 0.45,
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
      duration: 2.2,
      ease: "power2.inOut",
    }, 3.6);

    tl.to(baseRotation.current, {
      z: 0.15,
      duration: 2.2,
      ease: "power1.inOut",
    }, 3.6);

    // Move flare forward to match the front glass position z
    tl.to(flareRef.current.position, {
      z: 1.104,
      duration: 2.2,
      ease: "power2.inOut",
    }, 3.6);

    // Fade in LOCKED HUD text at 5.4s
    tl.to(".hud-locked-text", {
      opacity: 1,
      duration: 0.3,
      ease: "power1.out",
    }, 5.4);
    tl.to(".hud-locked-text", {
      opacity: 0,
      duration: 0.15,
      ease: "power1.in",
    }, 5.8);

    // Gold lens flare flash at 5.6s
    tl.to(flareRef.current.material, {
      opacity: 0.7,
      duration: 0.15,
      ease: "power1.out",
    }, 5.6);
    tl.to(flareRef.current.material, {
      opacity: 0,
      duration: 0.15,
      ease: "power1.in",
      onComplete: () => {
        // Just make sure it ends up transparent
        if (flareRef.current) {
          (flareRef.current.material as THREE.Material).opacity = 0;
        }
      }
    }, 5.75);

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

    // Fade out volumetric light, point light, and dust particles completely during focus transition
    tl.to(beamMaterial.uniforms.uOpacity, {
      value: 0.0,
      duration: 1.2,
      ease: "power2.inOut",
    }, 3.6);

    tl.to(particlesMaterial, {
      opacity: 0.0,
      duration: 1.2,
      ease: "power2.inOut",
    }, 3.6);

    if (pointLightRef.current) {
      tl.to(pointLightRef.current, {
        intensity: 0.0,
        duration: 1.2,
        ease: "power2.inOut",
      }, 3.6);
    }

    // HTML Text Scene 3
    tl.set(".text-scene-3", { display: "flex" }, 3.6);
    tl.to(".text-scene-3", { opacity: 1, y: 0, duration: 0.7 }, 3.6);
    tl.to(".text-scene-3", { opacity: 0, y: -40, duration: 0.7 }, 5.1);
    tl.set(".text-scene-3", { display: "none" }, 5.8);

    // ----------------------------------------------------
    // SCENE 4: CAPABILITIES / SERVICES (Scroll: 41.4% -> 61.4%, Timeline 5.8 -> 8.6)
    // Lens reassembles, camera body scales up and locks in, rotates in sync with mode dial
    // ----------------------------------------------------
    // Smooth, slow, and synchronized assembly reveal over 1.8 seconds (5.2s -> 7.0s)
    tl.to(lensGroupRef.current.position, {
      x: 0.0,
      y: 0.0,
      z: 0.0,
      duration: 1.8,
      ease: "power2.inOut",
    }, 5.2);

    // Reassemble glass elements inside lens
    tl.to(frontGlassRef.current.position, { z: 1.5, duration: 1.8, ease: "power2.inOut" }, 5.2);
    tl.to(midGlass1Ref.current.position, { z: 0.7, duration: 1.8, ease: "power2.inOut" }, 5.2);
    tl.to(midGlass2Ref.current.position, { z: -0.3, duration: 1.8, ease: "power2.inOut" }, 5.2);
    tl.to(focusRingRef.current.rotation, { z: 0, duration: 1.8, ease: "power2.inOut" }, 5.2);

    // CAMERA ASSEMBLY ANIMATION (Moved up to Scene 4)
    // Scale camera body up smoothly without sudden bounce
    tl.to(bodyRef.current.scale, {
      x: 1.50,
      y: 1.50,
      z: 1.50,
      duration: 1.8,
      ease: "power2.out",
    }, 5.2);

    // Push lens forward and rotate to twist-lock insertion angle
    tl.to(lensModelRef.current.position, {
      z: 1.8,
      duration: 0.9,
      ease: "power1.out",
    }, 5.2);
    tl.to(lensModelRef.current.rotation, {
      z: -0.8, // rotation angle for bayonet insertion
      duration: 0.9,
      ease: "power1.out",
    }, 5.2);

    // SNAP! Slide lens back onto mount and twist to lock
    tl.to(lensModelRef.current.position, {
      z: 0.0,
      duration: 0.9,
      ease: "power2.inOut",
    }, 6.1);
    tl.to(lensModelRef.current.rotation, {
      z: 0.0, // twist lock back to straight
      duration: 0.9,
      ease: "power2.inOut",
    }, 6.1);

    // Zoom camera to see the assembled body & dial console (zoomed out for better visibility)
    tl.to(cameraRef.current.position, {
      z: 10.5,
      duration: 1.8,
      ease: "power2.inOut",
    }, 5.2);

    // Dynamic rotation of 3D lens Y-axis in sync with dial rotation
    // Orient to a static starting position (-Math.PI * 0.8) during Scene 4
    tl.to(baseRotation.current, {
      x: 0.05,
      y: -Math.PI * 0.8,
      z: 0.0,
      duration: 1.8,
      ease: "power2.inOut",
    }, 5.2);

    // Ensure light beams & dust are completely faded out by the time assembly starts
    tl.to(beamMaterial.uniforms.uOpacity, { value: 0.0, duration: 0.4 }, 4.8);
    tl.to(particlesMaterial, { opacity: 0.0, duration: 0.4 }, 4.8);
    if (pointLightRef.current) {
      tl.to(pointLightRef.current, { intensity: 0.0, duration: 0.4 }, 4.8);
    }

    // HTML Text Capabilities Container Fade In/Out (synced with completion of assembly)
    tl.set(".text-scene-services", { display: "flex" }, 6.0);
    tl.to(".text-scene-services", { opacity: 1, y: 0, duration: 0.8 }, 6.0);
    tl.to(".text-scene-services", { opacity: 0, y: -40, duration: 0.4 }, 7.6);
    tl.set(".text-scene-services", { display: "none" }, 8.0);

    // ----------------------------------------------------
    // SCENE 4.5: THE MAKER (Scroll: 58.0% -> 66.0%, Timeline 8.0 -> 9.2)
    // Camera is assembled and remains static while Maker text fades in and out
    // ----------------------------------------------------
    tl.set(".text-scene-maker", { display: "flex" }, 8.0);
    tl.to(".text-scene-maker", { opacity: 1, y: 0, duration: 0.5 }, 8.0);
    tl.to(".text-scene-maker", { opacity: 0, y: -40, duration: 0.5 }, 8.7);
    tl.set(".text-scene-maker", { display: "none" }, 9.2);

    // ----------------------------------------------------
    // SCENE 5: THE GALLERY CAMERA SNAP (Scroll: 66.0% -> 80.0%, Timeline 9.2 -> 11.2)
    // Assembled camera faces the viewer to take portraits/photos
    // ----------------------------------------------------
    // Zoom camera slightly closer for interactive snap view (adjusted for better visibility)
    tl.to(cameraRef.current.position, {
      z: 5.8,
      duration: 1.2,
      ease: "power2.inOut",
    }, 9.2);

    // Tilt camera towards user for direct snap view
    tl.to(baseRotation.current, {
      x: 0.15,
      y: -0.3, // face more forward, slight angle for luxury depth
      z: 0.0,
      duration: 1.5,
      ease: "power2.inOut",
    }, 9.2);

    // HTML Text Scene 5
    tl.set(".text-scene-5", { display: "flex" }, 9.2);
    tl.to(".text-scene-5", { opacity: 1, y: 0, duration: 0.5 }, 9.2);
    tl.to(".text-scene-5", { opacity: 0, y: -40, duration: 0.5 }, 10.7);
    tl.set(".text-scene-5", { display: "none" }, 11.2);

    // ----------------------------------------------------
    // SCENE 6: THE LEGACY (Scroll: 80.0% -> 91.0%, Timeline 11.2 -> 12.6)
    // Assembled Camera drifts to bottom-left with ultra-smooth easing
    // ----------------------------------------------------
    tl.to(lensGroupRef.current.position, {
      x: -1.2,
      y: -0.5,
      z: -1.0,
      duration: 1.4,
      ease: "sine.inOut",
    }, 11.2);

    tl.to(baseRotation.current, {
      x: 0.15,
      y: -0.2,
      z: 0.0,
      duration: 1.4,
      ease: "sine.inOut",
    }, 11.2);

    // Zoom camera slightly closer (adjusted for better visibility)
    tl.to(cameraRef.current.position, {
      z: 6.0,
      duration: 1.4,
      ease: "sine.inOut",
    }, 11.2);

    // HTML Text Scene 6
    tl.set(".text-scene-6", { display: "flex" }, 11.2);
    tl.to(".text-scene-6", { opacity: 1, y: 0, duration: 0.5 }, 11.2);
    tl.to(".text-scene-6", { opacity: 0, y: -40, duration: 0.5 }, 12.1);
    tl.set(".text-scene-6", { display: "none" }, 12.6);

    // ----------------------------------------------------
    // SCENE 7: CTA / BOOKING (Scroll: 91.0% -> 100%, Timeline 12.6 -> 14.0)
    // Camera returns to center-back and closes aperture (camera stays in background)
    // ----------------------------------------------------
    // Return camera system to center-back and slide deep into the distance
    tl.to(lensGroupRef.current.position, {
      x: 0.0,
      y: 0.1,
      z: -10.0, // Retreat deep into the dark background
      duration: 1.4,
      ease: "power2.inOut",
    }, 12.6);

    tl.to(baseRotation.current, {
      x: 0.1,
      y: -0.6,
      z: 0.0,
      duration: 1.2,
      ease: "power2.inOut",
    }, 12.6);

    // Pull camera back
    tl.to(cameraRef.current.position, {
      z: 6.8,
      duration: 1.2,
      ease: "power2.inOut",
    }, 12.6);

    // Close aperture blades completely (rotate + scale to 0.0)
    tl.to(apertureGroupRef.current.rotation, {
      z: Math.PI / 1.5,
      duration: 1.0,
      ease: "power2.inOut",
    }, 12.8);

    tl.to(apertureGroupRef.current.scale, {
      x: 0.0,
      y: 0.0,
      z: 0.0,
      duration: 1.0,
      ease: "power2.inOut",
    }, 12.8);

    // Smoothly scale the entire camera system down to 0 to make it disappear
    tl.to(lensGroupRef.current.scale, {
      x: 0.0,
      y: 0.0,
      z: 0.0,
      duration: 1.2,
      ease: "power2.inOut",
    }, 12.8);

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
      <ambientLight intensity={0.16} />
      
      {/* Dynamic key light (warm, gold highlights) */}
      <directionalLight
        position={[6, 8, 5]}
        intensity={1.8}
        color="#fef08a"
        castShadow
      />
      
      {/* Dynamic rim light (cool blue highlights along casing edges) */}
      <directionalLight
        position={[-6, 4, -4]}
        intensity={2.2}
        color="#e0f2fe"
      />

      {/* Internal glow point light */}
      <pointLight
        ref={pointLightRef}
        position={[0, 0, 0.5]}
        intensity={0.8}
        distance={6}
        color="#fbbf24"
      />

      {/* 
        Nested Camera System:
        Wrapped inside a responsive wrapper group to adjust scale and offsets dynamically on mobile viewports.
      */}
      <group ref={responsiveWrapperRef}>
        <group
          ref={lensGroupRef}
          onClick={(e) => {
            e.stopPropagation();
            // Only allow camera click actions once the camera body starts scaling up (Scene 4+)
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

          {/* Golden lens flare flash mesh */}
          <mesh ref={flareRef} position={[0, 0, 0.72]}>
            <ringGeometry args={[0, 0.65, 32]} />
            <meshBasicMaterial
              color="#fbbf24"
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* 3D Camera Body (slides in on Z from background during assembly) */}
          <CameraBody bodyRef={bodyRef} />

          {/* Inside-the-lens effects: Volumetric Light & Dust scaled to fit lens barrel */}
          <group scale={[0.48, 0.48, 0.48]}>
            <VolumetricLight
              lightBeamRef={lightBeamRef}
              particlesRef={particlesRef}
            />
          </group>
        </group>
      </group>
    </>
  );
}
