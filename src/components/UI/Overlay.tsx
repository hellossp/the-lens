"use client";

import { useEffect, useState, useRef } from "react";
import { Camera, Sun, Moon } from "lucide-react";
import gsap from "gsap";

const STAGES = [
  { id: "lens", label: "THE LENS" },
  { id: "light", label: "THE LIGHT" },
  { id: "focus", label: "THE FOCUS" },
  { id: "services", label: "CAPABILITIES" },
  { id: "maker", label: "THE MAKER" },
  { id: "gallery", label: "SNAP GALLERY" },
  { id: "legacy", label: "THE LEGACY" },
  { id: "booking", label: "BOOK SESSION" },
];

export default function Overlay() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeStage, setActiveStage] = useState("lens");
  const [isDark, setIsDark] = useState(true);
  const scrollCueRef = useRef<HTMLDivElement>(null);
  const fadedOutRef = useRef(false);

  // Sync theme attribute to html element
  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.removeAttribute("data-theme");
    } else {
      html.setAttribute("data-theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    // Check initial scroll on mount
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const initialProgress = docHeight > 0 ? window.scrollY / docHeight : 0;
    if (initialProgress >= 0.25) {
      fadedOutRef.current = true;
      if (scrollCueRef.current) {
        scrollCueRef.current.style.opacity = "0";
        scrollCueRef.current.style.pointerEvents = "none";
        scrollCueRef.current.style.display = "none";
      }
    }
  }, []);

  useEffect(() => {
    if (scrollProgress >= 0.25 && !fadedOutRef.current) {
      fadedOutRef.current = true;
      if (scrollCueRef.current) {
        gsap.to(scrollCueRef.current, {
          opacity: 0,
          duration: 0.8,
          pointerEvents: "none",
          onComplete: () => {
            if (scrollCueRef.current) {
              scrollCueRef.current.style.display = "none";
            }
          }
        });
      }
    }
  }, [scrollProgress]);

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
      } else if (progress < 0.58) {
        setActiveStage("services");
      } else if (progress < 0.66) {
        setActiveStage("maker");
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
    if (scrollProgress < 0.58) return 100; // Capabilities dial
    return 100;
  };

  const getAperture = () => {
    if (scrollProgress < 0.14) return "f/8.0";
    if (scrollProgress < 0.28) return "f/1.2"; // Wide open for light rays
    if (scrollProgress < 0.44) return "f/2.8"; // Internal elements depth
    if (scrollProgress < 0.58) return "f/5.6"; // Capabilities dial
    if (scrollProgress < 0.66) return "f/2.0"; // The Maker
    if (scrollProgress < 0.80) return "f/4.0"; // Gallery
    return "f/16"; // Closing down
  };

  const getShutter = () => {
    if (scrollProgress < 0.44) return "1/250";
    if (scrollProgress < 0.58) return "1/500";
    return "1/125";
  };

  // Colors adapt to theme
  const hudBorderColor = isDark ? "border-white/20" : "border-black/15";
  const navDotInactive = isDark ? "bg-white/20 group-hover:bg-white/50" : "bg-black/20 group-hover:bg-black/50";
  const navLabelInactive = isDark ? "text-white/30 group-hover:opacity-60" : "text-black/30 group-hover:opacity-60";
  const progressBg = isDark ? "bg-white/10" : "bg-black/10";
  const scrollCueColor = isDark ? "text-white/40" : "text-black/40";
  const scrollCueBarColor = isDark ? "bg-white/30" : "bg-black/30";
  const metadataColor = isDark ? "text-white/60" : "text-black/50";
  const metaLabelColor = isDark ? "text-white/30" : "text-black/30";
  const metaValueColor = isDark ? "text-white" : "text-black";
  const recColor = isDark ? "text-white/80" : "text-black/70";
  const brandColor = isDark ? "text-white" : "text-[#1a1209]";
  const headerSubColor = isDark ? "text-white/50" : "text-black/40";

  return (
    <div className="fixed inset-0 pointer-events-none z-40 select-none font-sans">
      {/* Viewfinder Crop Marks - Four Corners */}
      <div className={`absolute top-4 left-4 md:top-8 md:left-8 w-6 h-6 md:w-8 md:h-8 border-t border-l ${hudBorderColor}`} />
      <div className={`absolute top-4 right-4 md:top-8 md:right-8 w-6 h-6 md:w-8 md:h-8 border-t border-r ${hudBorderColor}`} />
      <div className={`absolute bottom-4 left-4 md:bottom-8 md:left-8 w-6 h-6 md:w-8 md:h-8 border-b border-l ${hudBorderColor}`} />
      <div className={`absolute bottom-4 right-4 md:bottom-8 md:right-8 w-6 h-6 md:w-8 md:h-8 border-b border-r ${hudBorderColor}`} />

      {/* Viewfinder Grid Dots */}
      <div className={`absolute top-1/2 left-4 md:left-8 -translate-y-1/2 w-1.5 h-0.5 ${isDark ? "bg-white/10" : "bg-black/10"}`} />
      <div className={`absolute top-1/2 right-4 md:right-8 -translate-y-1/2 w-1.5 h-0.5 ${isDark ? "bg-white/10" : "bg-black/10"}`} />
      <div className={`absolute left-1/2 top-4 md:top-8 -translate-x-1/2 w-0.5 h-1.5 ${isDark ? "bg-white/10" : "bg-black/10"}`} />
      <div className={`absolute left-1/2 bottom-4 md:bottom-8 -translate-x-1/2 w-0.5 h-1.5 ${isDark ? "bg-white/10" : "bg-black/10"}`} />

      {/* Viewfinder Center Autofocus Brackets */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-between w-20 h-20 md:w-24 md:h-24 pointer-events-none">
        <div className={`w-2 h-6 md:w-3 md:h-8 border-t border-b border-l transition-all duration-500 ${
          activeStage === "focus"
            ? "border-emerald-500/80 scale-95 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
            : `${isDark ? "border-white/15" : "border-black/15"} scale-100`
        }`} />
        <div className="hud-locked-text text-[8px] md:text-[9px] text-emerald-500/80 font-mono tracking-widest absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 select-none pointer-events-none">
          LOCKED
        </div>
        <div className={`w-2 h-6 md:w-3 md:h-8 border-t border-b border-r transition-all duration-500 ${
          activeStage === "focus"
            ? "border-emerald-500/80 scale-95 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
            : `${isDark ? "border-white/15" : "border-black/15"} scale-100`
        }`} />
      </div>

      {/* Top Header Bar */}
      <header className="absolute top-4 left-4 right-4 md:top-8 md:left-8 md:right-8 flex justify-between items-center pointer-events-auto">
        <div className="flex items-center space-x-2">
          <Camera className="w-4.5 h-4.5 md:w-5 md:h-5 text-gold-400" />
          <span className={`font-serif text-base md:text-lg tracking-[0.25em] font-semibold ${brandColor}`}>
            THE LENS
          </span>
        </div>
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className={`flex items-center space-x-4 md:space-x-6 text-[9px] md:text-[10px] tracking-[0.2em] font-medium ${headerSubColor}`}>
            <span className="hidden md:inline">50MM F1.2 LENSE JOURNEY</span>
            <span className={recColor}>REC [●]</span>
          </div>
          {/* Theme Toggle */}
          <button
            id="theme-toggle"
            aria-label="Toggle theme"
            onClick={() => setIsDark((prev) => !prev)}
            className="theme-toggle-btn pointer-events-auto"
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </header>

      {/* Left Metadata Panel (ISO, Aperture, Shutter Speed) */}
      <div className={`absolute bottom-4 left-4 md:bottom-8 md:left-8 flex flex-row md:flex-col space-x-4 md:space-x-0 md:space-y-4 font-mono text-[9px] md:text-[11px] ${metadataColor}`}>
        <div className="flex flex-col">
          <span className={`text-[7px] md:text-[9px] tracking-wider ${metaLabelColor}`}>FOCAL</span>
          <span className={`font-medium tracking-wide ${metaValueColor}`}>50mm</span>
        </div>
        <div className="flex flex-col">
          <span className={`text-[7px] md:text-[9px] tracking-wider ${metaLabelColor}`}>APERTURE</span>
          <span className="text-gold-400 font-medium tracking-wide transition-all duration-300">
            {getAperture()}
          </span>
        </div>
        <div className="flex flex-col">
          <span className={`text-[7px] md:text-[9px] tracking-wider ${metaLabelColor}`}>SHUTTER</span>
          <span className={`font-medium tracking-wide transition-all duration-300 ${metaValueColor}`}>
            {getShutter()}s
          </span>
        </div>
        <div className="flex flex-col">
          <span className={`text-[7px] md:text-[9px] tracking-wider ${metaLabelColor}`}>ISO</span>
          <span className={`font-medium tracking-wide transition-all duration-300 ${metaValueColor}`}>
            {getISO()}
          </span>
        </div>
      </div>

      {/* Right Stage Navigation */}
      <nav className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 flex flex-col space-y-4 md:space-y-6">
        {STAGES.map((stage) => {
          const isActive = activeStage === stage.id;
          return (
            <div
              key={stage.id}
              className="flex items-center justify-end space-x-2 md:space-x-4 group cursor-pointer pointer-events-auto"
              onClick={() => {
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                let targetProgress = 0;
                if (stage.id === "lens") targetProgress = 0;
                else if (stage.id === "light") targetProgress = 0.20;
                else if (stage.id === "focus") targetProgress = 0.36;
                else if (stage.id === "services") targetProgress = 0.51;
                else if (stage.id === "maker") targetProgress = 0.62;
                else if (stage.id === "gallery") targetProgress = 0.73;
                else if (stage.id === "legacy") targetProgress = 0.85;
                else if (stage.id === "booking") targetProgress = 0.96;

                window.scrollTo({
                  top: targetProgress * docHeight,
                  behavior: "smooth",
                });
              }}
            >
              <span
                className={`hidden md:inline-block text-[10px] tracking-[0.25em] font-medium transition-all duration-300 text-right ${
                  isActive
                    ? "text-gold-400 font-bold opacity-100 translate-x-0"
                    : `${navLabelInactive} opacity-0 translate-x-2`
                }`}
              >
                {stage.label}
              </span>
              <div className="relative flex items-center justify-center w-3 h-3">
                <div
                  className={`absolute rounded-full transition-all duration-500 ${
                    isActive
                      ? "w-2 md:w-2.5 h-2 md:h-2.5 bg-gold-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                      : `w-1 h-1 ${navDotInactive}`
                  }`}
                />
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom Progress Bar & Scroll Indicator */}
      <footer className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-2 md:space-y-3">
        <div
          ref={scrollCueRef}
          className="flex flex-col items-center space-y-0.5 animate-bounce"
        >
          <span className={`text-[8px] md:text-[9px] tracking-[0.3em] ${scrollCueColor}`}>SCROLL TO TRAVEL</span>
          <div className={`w-0.5 h-3 md:h-4 ${scrollCueBarColor}`} />
        </div>
        <div className={`w-36 md:w-48 h-[1px] ${progressBg} rounded-full overflow-hidden relative`}>
          <div
            className="absolute h-full left-0 top-0 bg-gold-400 transition-all duration-100 ease-out"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>
      </footer>
    </div>
  );
}
