"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./Scene";

export default function CanvasContainer() {
  return (
    <div className="fixed inset-0 w-screen h-screen z-0 bg-[#030303] overflow-hidden pointer-events-none">
      <Canvas
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: 3, // THREE.ACESFilmicToneMapping
        }}
        dpr={[1, 2]} // limit to 2x for performance on high-res displays
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
