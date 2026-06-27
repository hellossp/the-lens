"use client";

import { useEffect, useState, useRef } from "react";
import { Camera } from "lucide-react";
import gsap from "gsap";
import { trackEvent } from "@/utils/analytics";

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
  const scrollCueRef = useRef<HTMLDivElement>(null);
  const fadedOutRef = useRef(false);

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
    if (scrollProgress < 0.28) return 800;
    if (scrollProgress < 0.44) return 400;
    if (scrollProgress < 0.58) return 100;
    return 100;
  };

  const getAperture = () => {
    if (scrollProgress < 0.14) return "f/8.0";
    if (scrollProgress < 0.28) return "f/1.2";
    if (scrollProgress < 0.44) return "f/2.8";
    if (scrollProgress < 0.58) return "f/5.6";
    if (scrollProgress < 0.66) return "f/2.0";
    if (scrollProgress < 0.80) return "f/4.0";
    return "f/16";
  };

  const getShutter = () => {
    if (scrollProgress < 0.44) return "1/250";
    if (scrollProgress < 0.58) return "1/500";
    return "1/125";
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-40 select-none font-sans">

      {/* Viewfinder Grid Dots */}
      <div className="absolute top-1/2 left-4 md:left-8 -translate-y-1/2 w-1.5 h-0.5 bg-white/10" />
      <div className="absolute top-1/2 right-4 md:right-8 -translate-y-1/2 w-1.5 h-0.5 bg-white/10" />
      <div className="absolute left-1/2 top-4 md:top-8 -translate-x-1/2 w-0.5 h-1.5 bg-white/10" />
      <div className="absolute left-1/2 bottom-4 md:bottom-8 -translate-x-1/2 w-0.5 h-1.5 bg-white/10" />

      {/* Viewfinder Center Autofocus Brackets — hidden on mobile to avoid overlapping centered content */}
      <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-between w-24 h-24 pointer-events-none">
        <div className={`w-3 h-8 border-t border-b border-l transition-all duration-500 ${
          activeStage === "focus"
            ? "border-emerald-500/80 scale-95 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
            : "border-white/15 scale-100"
        }`} />
        <div className="hud-locked-text text-[9px] text-emerald-500/80 font-mono tracking-widest absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 select-none pointer-events-none">
          LOCKED
        </div>
        <div className={`w-3 h-8 border-t border-b border-r transition-all duration-500 ${
          activeStage === "focus"
            ? "border-emerald-500/80 scale-95 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
            : "border-white/15 scale-100"
        }`} />
      </div>

      {/* Top Header Bar */}
      <header className="absolute top-4 left-4 right-4 md:top-8 md:left-8 md:right-8 flex justify-between items-center pointer-events-auto">
        <div className="flex items-center space-x-2">
          <Camera className="w-4.5 h-4.5 md:w-5 md:h-5 text-gold-400" />
          <span className="font-serif text-base md:text-lg tracking-[0.25em] font-semibold text-white">
            THE LENS
          </span>
        </div>
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="flex items-center space-x-4 md:space-x-6 text-[9px] md:text-[10px] tracking-[0.2em] font-medium text-white/50">
            <span className="hidden md:inline">50MM F1.2 LENSE JOURNEY</span>
            <a
              href="https://www.sitansu.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-400/80 hover:text-gold-400 font-bold transition-all border border-gold-500/20 hover:border-gold-500 bg-gold-500/5 px-2 py-0.5 rounded pointer-events-auto"
            >
              BY SITANSU
            </a>
            <span className="text-white/80">REC [●]</span>
          </div>
        </div>
      </header>

      {/* Left Metadata Panel — hidden on mobile to avoid overlap with CTA */}
      <div className="hidden md:flex absolute bottom-8 left-8 flex-col space-y-4 font-mono text-[11px] text-white/60">
        <div className="flex flex-col">
          <span className="text-[9px] tracking-wider text-white/30">FOCAL</span>
          <span className="font-medium tracking-wide text-white">50mm</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] tracking-wider text-white/30">APERTURE</span>
          <span className="text-gold-400 font-medium tracking-wide transition-all duration-300">
            {getAperture()}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] tracking-wider text-white/30">SHUTTER</span>
          <span className="font-medium tracking-wide transition-all duration-300 text-white">
            {getShutter()}s
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] tracking-wider text-white/30">ISO</span>
          <span className="font-medium tracking-wide transition-all duration-300 text-white">
            {getISO()}
          </span>
        </div>
      </div>

      {/* Mobile-only compact camera spec strip removed to prevent layout overlap */}


      {/* Right Stage Navigation */}
      <nav className="absolute right-3 md:right-8 top-1/2 -translate-y-1/2 flex flex-col space-y-3 md:space-y-6">
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

                if (stage.id === "booking") {
                  trackEvent("Schedule", { content_name: "Booking Dot Navigated" });
                }

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
                    : "text-white/30 group-hover:opacity-60 opacity-0 translate-x-2"
                }`}
              >
                {stage.label}
              </span>
              <div className="relative flex items-center justify-center w-3 h-3">
                <div
                  className={`absolute rounded-full transition-all duration-500 ${
                    isActive
                      ? "w-2 md:w-2.5 h-2 md:h-2.5 bg-gold-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                      : "w-1 h-1 bg-white/20 group-hover:bg-white/50"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom Progress Bar & Scroll Indicator */}
      <footer className="absolute bottom-12 md:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-2 md:space-y-3">
        <div
          ref={scrollCueRef}
          className="flex flex-col items-center space-y-0.5 animate-bounce"
        >
          <span className="hidden sm:inline text-[8px] md:text-[9px] tracking-[0.3em] text-white/40">SCROLL TO TRAVEL</span>
          <div className="w-0.5 h-3 md:h-4 bg-white/30" />
        </div>
        <div className="w-36 md:w-48 h-[1px] bg-white/10 rounded-full overflow-hidden relative">
          <div
            className="absolute h-full left-0 top-0 bg-gold-400 transition-all duration-100 ease-out"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>
      </footer>
    </div>
  );
}
