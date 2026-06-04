"use client";

import { useEffect, useState } from "react";
import { Camera, Scroll } from "lucide-react";

const STAGES = [
  { id: "lens", label: "THE LENS" },
  { id: "light", label: "THE LIGHT" },
  { id: "focus", label: "THE FOCUS" },
  { id: "services", label: "CAPABILITIES" },
  { id: "gallery", label: "SNAP GALLERY" },
  { id: "legacy", label: "THE LEGACY" },
  { id: "booking", label: "BOOK SESSION" },
];

export default function Overlay() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeStage, setActiveStage] = useState("lens");

  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPos = window.scrollY;
      const progress = docHeight > 0 ? scrollPos / docHeight : 0;
      setScrollProgress(progress);

      // Determine active stage based on progress
      if (progress < 0.14) {
        setActiveStage("lens");
      } else if (progress < 0.28) {
        setActiveStage("light");
      } else if (progress < 0.44) {
        setActiveStage("focus");
      } else if (progress < 0.62) {
        setActiveStage("services");
      } else if (progress < 0.80) {
        setActiveStage("gallery");
      } else if (progress < 0.91) {
        setActiveStage("legacy");
      } else {
        setActiveStage("booking");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Compute dynamic stats based on scroll progress
  const getISO = () => {
    if (scrollProgress < 0.14) return 100;
    if (scrollProgress < 0.28) return 800; // Entering dark light scene
    if (scrollProgress < 0.44) return 400;
    if (scrollProgress < 0.62) return 100; // Capabilities dial
    return 100;
  };

  const getAperture = () => {
    if (scrollProgress < 0.14) return "f/8.0";
    if (scrollProgress < 0.28) return "f/1.2"; // Wide open for light rays
    if (scrollProgress < 0.44) return "f/2.8"; // Internal elements depth
    if (scrollProgress < 0.62) return "f/5.6"; // Capabilities dial
    if (scrollProgress < 0.80) return "f/4.0"; // Gallery
    return "f/16"; // Closing down
  };

  const getShutter = () => {
    if (scrollProgress < 0.44) return "1/250";
    if (scrollProgress < 0.62) return "1/500";
    return "1/125";
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-40 select-none font-sans">
      {/* Viewfinder Crop Marks - Four Corners */}
      <div className="absolute top-6 left-6 w-8 h-8 border-t border-l border-white/20" />
      <div className="absolute top-6 right-6 w-8 h-8 border-t border-r border-white/20" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b border-l border-white/20" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b border-r border-white/20" />

      {/* Viewfinder Grid Dots (Subtle camera screen grid crosshairs) */}
      <div className="absolute top-1/2 left-6 -translate-y-1/2 w-1.5 h-0.5 bg-white/10" />
      <div className="absolute top-1/2 right-6 -translate-y-1/2 w-1.5 h-0.5 bg-white/10" />
      <div className="absolute left-1/2 top-6 -translate-x-1/2 w-0.5 h-1.5 bg-white/10" />
      <div className="absolute left-1/2 bottom-6 -translate-x-1/2 w-0.5 h-1.5 bg-white/10" />

      {/* Viewfinder Center Autofocus Brackets */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-between w-24 h-24 pointer-events-none">
        <div className={`w-3 h-8 border-t border-b border-l transition-all duration-500 ${
          activeStage === "focus" 
            ? "border-emerald-500/80 scale-95 shadow-[0_0_10px_rgba(16,185,129,0.2)]" 
            : "border-white/15 scale-100"
        }`} />
        {activeStage === "focus" && (
          <div className="text-[9px] text-emerald-500/80 font-mono tracking-widest absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse">
            LOCKED
          </div>
        )}
        <div className={`w-3 h-8 border-t border-b border-r transition-all duration-500 ${
          activeStage === "focus" 
            ? "border-emerald-500/80 scale-95 shadow-[0_0_10px_rgba(16,185,129,0.2)]" 
            : "border-white/15 scale-100"
        }`} />
      </div>

      {/* Top Header Bar */}
      <header className="absolute top-8 left-8 right-8 flex justify-between items-center pointer-events-auto mix-blend-difference">
        <div className="flex items-center space-x-2">
          <Camera className="w-5 h-5 text-gold-400" />
          <span className="font-serif text-lg tracking-[0.25em] font-semibold text-white">
            THE LENS
          </span>
        </div>
        <div className="flex items-center space-x-6 text-[10px] tracking-[0.2em] font-medium text-white/50">
          <span className="hidden md:inline">50MM F1.2 LENSE JOURNEY</span>
          <span className="text-white/80">REC [●]</span>
        </div>
      </header>

      {/* Left Metadata Panel (ISO, Aperture, Shutter Speed) */}
      <div className="absolute bottom-8 left-8 flex flex-col space-y-4 mix-blend-difference font-mono text-[11px] text-white/60">
        <div className="flex flex-col">
          <span className="text-[9px] text-white/30 tracking-wider">FOCAL</span>
          <span className="text-white font-medium tracking-wide">50mm</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] text-white/30 tracking-wider">APERTURE</span>
          <span className="text-gold-400 font-medium tracking-wide transition-all duration-300">
            {getAperture()}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] text-white/30 tracking-wider">SHUTTER</span>
          <span className="text-white font-medium tracking-wide transition-all duration-300">
            {getShutter()}s
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] text-white/30 tracking-wider">ISO</span>
          <span className="text-white font-medium tracking-wide transition-all duration-300">
            {getISO()}
          </span>
        </div>
      </div>

      {/* Right Stage Navigation */}
      <nav className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col space-y-6 mix-blend-difference">
        {STAGES.map((stage) => {
          const isActive = activeStage === stage.id;
          return (
            <div
              key={stage.id}
              className="flex items-center justify-end space-x-4 group cursor-pointer pointer-events-auto"
              onClick={() => {
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                let targetProgress = 0;
                if (stage.id === "lens") targetProgress = 0;
                else if (stage.id === "light") targetProgress = 0.20;
                else if (stage.id === "focus") targetProgress = 0.36;
                else if (stage.id === "services") targetProgress = 0.53;
                else if (stage.id === "gallery") targetProgress = 0.71;
                else if (stage.id === "legacy") targetProgress = 0.85;
                else if (stage.id === "booking") targetProgress = 0.96;

                window.scrollTo({
                  top: targetProgress * docHeight,
                  behavior: "smooth",
                });
              }}
            >
              <span
                className={`text-[10px] tracking-[0.25em] font-medium transition-all duration-300 text-right ${
                  isActive
                    ? "text-gold-400 font-bold opacity-100 translate-x-0"
                    : "text-white/30 opacity-0 group-hover:opacity-60 translate-x-2"
                }`}
              >
                {stage.label}
              </span>
              <div className="relative flex items-center justify-center w-3 h-3">
                <div
                  className={`absolute rounded-full transition-all duration-500 ${
                    isActive
                      ? "w-2.5 h-2.5 bg-gold-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                      : "w-1 h-1 bg-white/20 group-hover:bg-white/50"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom Progress Bar & Scroll Indicator */}
      <footer className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-3 mix-blend-difference">
        {scrollProgress < 0.95 && (
          <div className="flex flex-col items-center space-y-1 animate-bounce">
            <span className="text-[9px] tracking-[0.3em] text-white/40">SCROLL TO TRAVEL</span>
            <div className="w-0.5 h-4 bg-white/30" />
          </div>
        )}
        <div className="w-48 h-[1px] bg-white/10 rounded-full overflow-hidden relative">
          <div
            className="absolute h-full left-0 top-0 bg-gold-400 transition-all duration-100 ease-out"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>
      </footer>
    </div>
  );
}
