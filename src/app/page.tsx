"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import LenisProvider from "@/components/UI/LenisProvider";
import CustomCursor from "@/components/UI/CustomCursor";
import Overlay from "@/components/UI/Overlay";
import { Camera, Calendar, ArrowRight, User, Mail, MessageSquare, Lock, Eye, X } from "lucide-react";
import GrabModal from "@/components/UI/GrabModal";

// Dynamically import the Canvas Container to bypass SSR issues
const CanvasContainer = dynamic(
  () => import("@/components/ThreeCanvas/CanvasContainer"),
  { ssr: false }
);

interface PhotoItem {
  id: string;
  title: string;
  url: string;
  stats: string;
  category: string;
}

const PHOTO_POOL: PhotoItem[] = [
  { id: "wedding", title: "Wedding Legacy", url: "/images/wedding_couple.png", stats: "50mm • f/1.2 • 1/250s • ISO 100", category: "WEDDING" },
  { id: "portrait", title: "Editorial Portrait", url: "/images/fashion_portrait.png", stats: "50mm • f/1.4 • 1/500s • ISO 200", category: "PORTRAIT" },
  { id: "travel", title: "Destination Travel", url: "/images/travel_scenery.png", stats: "50mm • f/2.8 • 1/1000s • ISO 400", category: "TRAVEL" },
  { id: "family", title: "Family Moment", url: "/images/family_moment.png", stats: "50mm • f/2.0 • 1/125s • ISO 100", category: "FAMILY" },
];

interface MockProject {
  serviceIdx: number;
  title: string;
  location: string;
  lens: string;
  img: string;
}

const MOCK_PROJECTS: MockProject[] = [
  {
    serviceIdx: 0,
    title: "Elysian Estate Elopement",
    location: "Como, Italy",
    lens: "50mm F1.2",
    img: "/images/wedding_couple.png"
  },
  {
    serviceIdx: 1,
    title: "Sovereign Soul Studio",
    location: "Studio 4, Paris",
    lens: "85mm F1.4",
    img: "/images/fashion_portrait.png"
  },
  {
    serviceIdx: 2,
    title: "Vanguard Summit Keynote",
    location: "Metropolitan Hall, NY",
    lens: "24-70mm F2.8",
    img: "/images/travel_scenery.png"
  },
  {
    serviceIdx: 3,
    title: "Aura Skincare Campaign",
    location: "Commercial Set 2",
    lens: "90mm Macro F8.0",
    img: "/images/family_moment.png"
  },
  {
    serviceIdx: 4,
    title: "The Eternal Shore Film",
    location: "Reine, Norway",
    lens: "35mm Cine F2.0",
    img: "/images/legacy_hero.png"
  },
  {
    serviceIdx: 5,
    title: "Aero Peak Expedition",
    location: "Zermatt, Switzerland",
    lens: "20mm Drone F4.0",
    img: "/images/travel_scenery.png"
  },
  {
    serviceIdx: 6,
    title: "Silent Drift Post-Process",
    location: "Studio Edit Bay",
    lens: "Resolve 18 Studio",
    img: "/images/legacy_hero.png"
  }
];

const HUD_SPECS = [
  { focal: "50mm", aperture: "F1.2", shutter: "1/250s", fNumber: "f/1.2", iso: "ISO 100" },
  { focal: "85mm", aperture: "F1.4", shutter: "1/400s", fNumber: "f/1.4", iso: "ISO 100" },
  { focal: "24-70mm", aperture: "F2.8", shutter: "1/500s", fNumber: "f/2.8", iso: "ISO 400" },
  { focal: "90mm", aperture: "F8.0", shutter: "1/125s", fNumber: "f/8.0", iso: "ISO 100" },
  { focal: "35mm", aperture: "F2.0", shutter: "1/50s", fNumber: "f/2.0", iso: "ISO 200" },
  { focal: "20mm", aperture: "F4.0", shutter: "1/1000s", fNumber: "f/4.0", iso: "ISO 100" },
  { focal: "DaVinci", aperture: "Grading", shutter: "EDIT", fNumber: "Resolve", iso: "POST" },
  { focal: "Custom", aperture: "Vision", shutter: "RAW", fNumber: "Manual", iso: "STUDIO" }
];

// Synthesize a camera shutter click on the fly using Web Audio API
let lastClickTime = 0;
const playShutterSound = () => {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastClickTime < 120) return;
  lastClickTime = now;
  try {
    const ctx = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();

    // Crisp mechanical dial click sound
    const bufferSize = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 1600;
    bandpass.Q.value = 5;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.35, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    noiseSource.connect(bandpass);
    bandpass.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseSource.start();
  } catch {
    // silence errors
  }
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  // Interactive Shutter/Gallery states
  const [unlockedPhotos, setUnlockedPhotos] = useState<PhotoItem[]>([]);
  const [flash, setFlash] = useState(false);
  const [activeLightbox, setActiveLightbox] = useState<PhotoItem | null>(null);

  // Scroll stage tracking state
  const [activeStage, setActiveStage] = useState("lens");

  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPos = window.scrollY;
      const progress = docHeight > 0 ? scrollPos / docHeight : 0;

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
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Capabilities Mode Dial states
  const [customVision, setCustomVision] = useState("");
  const [customSubmitted, setCustomSubmitted] = useState(false);
  const [activeExplorerIdx, setActiveExplorerIdx] = useState<number | null>(null);

  const openProjectExplorer = (idx: number) => {
    setActiveExplorerIdx(idx);
  };

  const handleCustomVisionSubmit = () => {
    if (!customVision.trim()) return;
    setCustomSubmitted(true);
    setTimeout(() => {
      setCustomSubmitted(false);
      setCustomVision("");
    }, 3000);
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, []);

  // Active service state for Capabilities Section Mode Dial
  const [activeServiceIdx, setActiveServiceIdx] = useState(0);
  const [focusRingPulse, setFocusRingPulse] = useState(false);

  // Trigger green focus ring flash pulse when dial changes
  const triggerFocusRingPulse = () => {
    setFocusRingPulse(true);
    setTimeout(() => setFocusRingPulse(false), 200);
  };

  const handlePrevService = () => {
    setActiveServiceIdx((prev) => {
      const nextIdx = prev > 0 ? prev - 1 : 7;
      playShutterSound();
      triggerFocusRingPulse();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("dial-change", { detail: { index: nextIdx } }));
      }
      return nextIdx;
    });
  };

  const handleNextService = () => {
    setActiveServiceIdx((prev) => {
      const nextIdx = prev < 7 ? prev + 1 : 0;
      playShutterSound();
      triggerFocusRingPulse();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("dial-change", { detail: { index: nextIdx } }));
      }
      return nextIdx;
    });
  };



  const triggerShutter = () => {
    // 1. Trigger camera flash overlay
    setFlash(true);
    setTimeout(() => setFlash(false), 250);

    // 2. Play Audio Shutter click
    playShutterSound();

    // 3. Unlock the next photo in sequence
    setUnlockedPhotos((prev) => {
      if (prev.length >= PHOTO_POOL.length) return prev; // All already unlocked
      const nextPhoto = PHOTO_POOL[prev.length];
      return [...prev, nextPhoto];
    });
  };

  // Listen to camera shutter click events dispatched from the 3D Canvas
  useEffect(() => {
    const handleShutter = () => {
      triggerShutter();
    };

    window.addEventListener("camera-shutter", handleShutter);
    return () => window.removeEventListener("camera-shutter", handleShutter);
  }, []);

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  if (!mounted) return null;

  return (
    <LenisProvider>
      <CustomCursor />

      {/* 1. Fullscreen Camera Shutter Flash */}
      <div
        className={`fixed inset-0 z-[9999] pointer-events-none transition-opacity duration-300 ${flash ? "opacity-95" : "opacity-0"
          }`}
        style={{ background: 'var(--background)' }}
      />

      {/* 2. Cinematic Preloader */}
      <div
        className={`fixed inset-0 flex flex-col items-center justify-center z-[999] transition-opacity duration-1000 ease-in-out pointer-events-none ${loading ? "opacity-100" : "opacity-0"
          }`}
        style={{ background: 'var(--background)' }}
      >
        <div className="flex flex-col items-center space-y-6">
          <div className="relative flex items-center justify-center w-20 h-20">
            <div className="absolute inset-0 rounded-full border-2 border-gold-500 border-t-transparent animate-spin" />
            <Camera className="w-8 h-8 text-gold-400 animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="font-serif text-2xl tracking-[0.3em]" style={{ color: 'var(--scene-text)' }}>THE LENS</h2>
            <p className="text-[10px] tracking-[0.25em]" style={{ color: 'var(--scene-body)' }}>CALIBRATING GLASS ELEMENTS...</p>
          </div>
        </div>
      </div>

      {/* 3. Background 3D Canvas */}
      <CanvasContainer />

      {/* 4. Subtle Film Grain overlay */}
      <div className="film-grain" />

      {/* 5. Foreground camera viewfinder HUD */}
      <Overlay />

      {/* 
        6. Scroll Container 
        850vh provides the scroll distance mapped to GSAP ScrollTrigger timeline.
      */}
      <main id="scroll-container" className="relative z-10 w-full min-h-[850vh] bg-transparent">

        {/* Sticky viewport wrapper for all HTML copy screens */}
        <div className="sticky top-0 left-0 w-full h-screen flex items-center justify-center pointer-events-none overflow-hidden">

          {/* ═══════════════════════════════════════════════
              SCENE 1 — THE LENS
              Left-aligned, HUD-cleared, stacked
              ═══════════════════════════════════════════════ */}
          <div
            className={`text-scene-1 absolute inset-0 translate-y-0 ${activeStage === "lens" ? "pointer-events-auto" : "pointer-events-none"}`}
          >
            <div className="scene-lower-third">
              {/* Ghost camera data echo — ties visually to the left HUD */}
              <div className="scene-spec-echo">50MM · f/8.0 · 1/250s · ISO 100</div>
              <div className="scene-chapter-tag">A Portal to Freeze Time</div>
              <h1 className="scene-heading">THE LENS</h1>
              <p className="scene-body">
                Photography is the art of freezing a heartbeat, holding a fraction of a second before it slips into the forever past.
              </p>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════
              SCENE 2 — THE LIGHT
              Right-aligned — 3D lens drifts left in 3D space
              ═══════════════════════════════════════════════ */}
          <div
            className={`text-scene-2 absolute inset-0 opacity-0 translate-y-10 ${activeStage === "light" ? "pointer-events-auto" : "pointer-events-none"}`}
            style={{ display: 'none' }}
          >
            <div className="scene-lower-third align-right">
              <div className="scene-spec-echo">50MM · f/1.2 · 1/250s · ISO 800</div>
              <div className="scene-chapter-tag">Chapter I · The Source</div>
              <h2 className="scene-heading">LIGHT REVEALS<br />THE SOUL</h2>
              <p className="scene-body">
                Every memory begins as raw light. We shape, refract, and capture it through precision glass, turning fleeting rays into permanent feelings.
              </p>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════
              SCENE 3 — THE FOCUS
              Left-aligned — 3D lens drifts right in 3D space
              ═══════════════════════════════════════════════ */}
          <div
            className={`text-scene-3 absolute inset-0 opacity-0 translate-y-10 ${activeStage === "focus" ? "pointer-events-auto" : "pointer-events-none"}`}
            style={{ display: 'none' }}
          >
            <div className="scene-lower-third">
              <div className="scene-spec-echo">50MM · f/2.8 · 1/500s · ISO 400</div>
              <div className="scene-chapter-tag">Chapter II · Intention</div>
              <h2 className="scene-heading">FOCUS CREATES<br />MEANING</h2>
              <p className="scene-body">
                In a crowded, noisy world, focus decides what truly matters. By isolating the subject and softening everything else, we lock onto authentic, raw emotion.
              </p>
            </div>
          </div>

          {/* SCENE 4: CAPABILITIES / SERVICES INTERACTIVE MODE DIAL */}
          <div className={`text-scene-services absolute inset-0 flex items-start md:items-center justify-center px-3 md:px-12 opacity-0 translate-y-10 z-20 w-full max-w-6xl mx-auto pt-14 md:pt-0 overflow-y-auto md:overflow-hidden ${activeStage === "services" ? "pointer-events-auto" : "pointer-events-none"}`} style={{ display: "none" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-center w-full md:max-h-[85vh]">
              {/* Left Column: Camera Mode Dial Panel */}
              <div className="flex flex-col items-center justify-center space-y-2 md:space-y-4 select-none">
                {/* HUD LCD Viewfinder Panel */}
                <div className="lcd-display-hud glass w-full max-w-[240px] md:max-w-[280px] p-2.5 md:p-3 rounded-lg border border-white/10 relative overflow-hidden bg-black/60 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
                  {/* Technical yellow accent line */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gold-500/80" />

                  {/* Inner HUD Info */}
                  <div className="flex justify-between items-start font-mono text-[9px] md:text-[10px] text-white/50 mb-1.5">
                    <div className="flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-white/80">AF-C LOCK</span>
                    </div>
                    <div>{HUD_SPECS[activeServiceIdx].focal} {HUD_SPECS[activeServiceIdx].aperture}</div>
                  </div>

                  {/* Main Mode Index and Title Display */}
                  <div className="flex items-center space-x-3 py-1 border-t border-b border-white/5 relative">
                    {/* Vertical monospaced sliding number strip */}
                    <div className="h-[18px] overflow-hidden relative w-6 font-mono text-xs md:text-sm text-gold-400 font-bold">
                      <div
                        className="hud-number-strip flex flex-col space-y-0 text-center transition-transform duration-[350ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                        style={{
                          height: '144px',
                          transform: `translateY(-${activeServiceIdx * 18}px)`
                        }}
                      >
                        <div className="h-[18px] leading-[18px]">01</div>
                        <div className="h-[18px] leading-[18px]">02</div>
                        <div className="h-[18px] leading-[18px]">03</div>
                        <div className="h-[18px] leading-[18px]">04</div>
                        <div className="h-[18px] leading-[18px]">05</div>
                        <div className="h-[18px] leading-[18px]">06</div>
                        <div className="h-[18px] leading-[18px]">07</div>
                        <div className="h-[18px] leading-[18px]">08</div>
                      </div>
                    </div>

                    <div className="h-[18px] overflow-hidden relative flex-1 text-[9px] md:text-[10px] font-bold text-white uppercase tracking-wider">
                      <div className="relative w-full h-full">
                        {[
                          "WEDDINGS",
                          "PORTRAITS & FAMILY",
                          "EVENTS & CORPORATE",
                          "PRODUCT & COMMERCIAL",
                          "CINEMATIC VIDEO",
                          "DRONE COVERAGE",
                          "EDITING & POST",
                          "OTHER SERVICES"
                        ].map((title, idx) => (
                          <div
                            key={idx}
                            className={`absolute inset-0 transition-all duration-300 ${activeServiceIdx === idx
                                ? "opacity-100 translate-y-0"
                                : "opacity-0 translate-y-2 pointer-events-none"
                              }`}
                          >
                            {title}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Technical Specs grid */}
                  <div className="grid grid-cols-3 gap-1 font-mono text-[8px] text-white/40 mt-1.5 pt-1 border-t border-white/5 text-center font-bold">
                    <div className="text-white/80">{HUD_SPECS[activeServiceIdx].shutter}</div>
                    <div className="border-l border-r border-white/5 text-gold-400">{HUD_SPECS[activeServiceIdx].fNumber}</div>
                    <div className="text-white/80">{HUD_SPECS[activeServiceIdx].iso}</div>
                  </div>
                </div>

                {/* Mechanical Selector Notch Indicator */}
                <div className="flex flex-col items-center z-10 -mb-2">
                  <div className="text-[8px] font-mono font-bold tracking-[0.2em] text-gold-400 uppercase bg-[#18181b] px-2 py-0.5 border border-gold-500/20 rounded">
                    ▼ ACTIVE
                  </div>
                </div>

                {/* Machined Metal Mode Dial Console (Responsive sizing and position translation) */}
                <div className="relative w-[180px] h-[180px] md:w-[260px] md:h-[260px] flex items-center justify-center [--translate-dist:58px] md:[--translate-dist:85px]">
                  <div className="control-wheel-bezel absolute inset-0 rounded-full border border-white/10" />

                  <div className="absolute inset-[10px] md:inset-[15px] rounded-full bg-zinc-900 border border-white/5 shadow-[inset_0_0_12px_rgba(0,0,0,0.9)] flex items-center justify-center">
                    <div className={`control-wheel-focus-ring absolute inset-[1.5px] md:inset-[2px] rounded-full transition-all duration-300 ${focusRingPulse
                        ? "border-emerald-500/80 shadow-[0_0_18px_rgba(16,185,129,0.6),inset_0_0_10px_rgba(16,185,129,0.3)]"
                        : "border-white/5"
                      }`} />

                    <div className="absolute inset-[5px] md:inset-[8px] rounded-full bg-[#111112] shadow-lg flex items-center justify-center">
                      <div className="absolute w-[60px] h-[60px] md:w-[80px] md:h-[80px] rounded-full bg-zinc-950 border border-white/10 flex flex-col items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.05)] z-20">
                        <Camera className="w-4 h-4 md:w-5.5 md:h-5.5 text-zinc-600 mb-0.5" />
                        <span className="text-[6px] md:text-[7px] font-mono font-bold text-zinc-500 tracking-wider">DIAL</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="control-wheel absolute inset-[18px] md:inset-[25px] rounded-full z-10"
                    style={{
                      transform: `rotate(${-90 - activeServiceIdx * 30}deg)`,
                      transition: 'transform 0.4s cubic-bezier(0.25, 1.5, 0.5, 1)'
                    }}
                  >
                    {[
                      { label: "WED", angle: 0 },
                      { label: "PORT", angle: 30 },
                      { label: "CORP", angle: 60 },
                      { label: "COMM", angle: 90 },
                      { label: "FILM", angle: 120 },
                      { label: "DRON", angle: 150 },
                      { label: "POST", angle: 180 },
                      { label: "OTHR", angle: 210 }
                    ].map((mode, i) => (
                      <div
                        key={i}
                        className="absolute left-1/2 top-1/2 -ml-[25px] -mt-[12px] w-[50px] h-[24px] flex items-center justify-center"
                        style={{
                          transform: `rotate(${mode.angle}deg) translate(var(--translate-dist))`
                        }}
                      >
                        <div
                          className={`control-wheel-label-text font-mono text-[8px] md:text-[9px] font-bold tracking-[0.1em] uppercase transition-all duration-300 ${activeServiceIdx === i ? "text-gold-400 font-extrabold scale-110" : "text-white/30"
                            }`}
                          style={{
                            transform: `rotate(${-(-90 - activeServiceIdx * 30 + mode.angle)}deg)`
                          }}
                        >
                          {mode.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tactile Navigation Buttons */}
                <div className="flex justify-between items-center w-[180px] md:w-[260px] gap-2 md:gap-3 mt-3 md:mt-4">
                  <button
                    onClick={handlePrevService}
                    className="flex-1 py-2 md:py-2.5 px-3 md:px-4 bg-zinc-900/90 hover:bg-zinc-800/90 border border-gold-500/30 hover:border-gold-400 text-gold-400 hover:text-white font-mono text-[8px] md:text-[10px] font-bold tracking-[0.25em] uppercase rounded-md transition-all flex items-center justify-center space-x-1 md:space-x-2 shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] cursor-pointer active:scale-95 active:bg-black"
                  >
                    <span>◄</span>
                    <span>PREV</span>
                  </button>
                  <button
                    onClick={handleNextService}
                    className="flex-1 py-2 md:py-2.5 px-3 md:px-4 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 border border-gold-500 text-black font-mono text-[8px] md:text-[10px] font-bold tracking-[0.25em] uppercase rounded-md transition-all flex items-center justify-center space-x-1 md:space-x-2 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] cursor-pointer active:scale-95 active:opacity-90"
                  >
                    <span>NEXT</span>
                    <span>►</span>
                  </button>
                </div>
              </div>

              {/* Right Side: Service Details Cards */}
              <div className="relative h-[260px] sm:h-[300px] md:h-[320px] flex items-center justify-center w-full">
                {[
                  {
                    title: "Weddings & Intimate Elopements",
                    description: "Freezing the quiet, raw emotion of your vows. We document the tear before it falls, the sudden bursts of laughter, and the details of a day that mark the beginning of a lifelong legacy.",
                    media: "/images/wedding_couple.png",
                    specs: "50mm • f/1.2 • 1/250s • ISO 100"
                  },
                  {
                    title: "Editorial Portraits & Legacies",
                    description: "Personalized, soul-revealing portraiture. We click pictures that capture your true character, your family's authentic warmth, and the frozen moments you will look back on for generations.",
                    media: "/images/fashion_portrait.png",
                    specs: "85mm • f/1.4 • 1/400s • ISO 100"
                  },
                  {
                    title: "Brand Stories & Keynotes",
                    description: "High-fidelity coverage that captures the heartbeat of your brand. We focus on the passion of your speakers, the connections of your guests, and the milestone achievements of your team.",
                    media: "/images/travel_scenery.png",
                    specs: "24-70mm • f/2.8 • 1/500s • ISO 400"
                  },
                  {
                    title: "Commercial Form & Textures",
                    description: "Crafted visuals that define the essence of your creation. We shape light around form, texture, and design, giving products a premium presence that commands attention.",
                    media: "/images/family_moment.png",
                    specs: "90mm Macro • f/8.0 • 1/125s • ISO 100"
                  },
                  {
                    title: "Cinematic Films & Vignettes",
                    description: "Motion stories that feel like cinema. We record in rich, film-inspired color tones, capturing the rhythm of your voice, the atmosphere of your space, and the flow of your story.",
                    media: "/images/legacy_hero.png",
                    specs: "35mm Cine • f/2.0 • 1/50s • ISO 200"
                  },
                  {
                    title: "Aerial Vantage & Vistas",
                    description: "Breathtaking perspectives from above. We frame the scale of your architecture, the drama of your landscapes, and the sweeping angles of your special occasions.",
                    media: "/images/travel_scenery.png",
                    specs: "20mm Drone • f/4.0 • 1/1000s • ISO 100"
                  },
                  {
                    title: "Analog Grades & Retouching",
                    description: "Polishing raw elements into timeless art. We color-grade, balance, and assemble your frames, ensuring every image carries a unified, luxury feeling that screams your brand.",
                    media: "/images/legacy_hero.png",
                    specs: "DaVinci Resolve • Lightroom Custom Lut"
                  },
                  {
                    title: "Custom Visions & Concepts",
                    description: "Have a unique creative concept or analog experiment? Share your thoughts below, and let us design a bespoke session built around your personal story.",
                    isOtherForm: true
                  }
                ].map((service, idx) => (
                  <div
                    key={idx}
                    className={`service-card-${idx} absolute inset-0 flex flex-col justify-between p-4 md:p-6 rounded-xl border border-white/[0.12] bg-zinc-950/95 backdrop-blur-md shadow-2xl w-full h-full transition-all duration-300 ${
                      activeServiceIdx === idx && activeStage === "services"
                        ? "opacity-100 scale-100 pointer-events-auto z-10"
                        : "opacity-0 scale-95 pointer-events-none z-0"
                    }`}
                  >
                    <div className="flex-1 flex flex-row gap-3 md:gap-4 overflow-hidden h-full">
                      {/* Card Left: Details Copy */}
                      <div className="flex-1 flex flex-col justify-center space-y-2 md:space-y-3">
                        <span className="text-[7px] md:text-[9px] font-mono tracking-[0.3em] text-gold-400 uppercase">
                          CAPABILITY {idx + 1} / 08
                        </span>
                        <h3 className="font-serif text-sm md:text-lg font-bold tracking-wide text-white uppercase leading-tight">
                          {service.title}
                        </h3>
                        <p className="text-[10px] md:text-[13px] tracking-wide text-white/75 leading-relaxed max-h-[80px] md:max-h-none overflow-y-auto no-scrollbar">
                          {service.description}
                        </p>

                        {!service.isOtherForm && (
                          <button
                            onClick={() => openProjectExplorer(idx)}
                            className="w-fit border border-gold-500/30 hover:border-gold-400 bg-gold-500/5 hover:bg-gold-500/10 text-gold-400 text-[8px] md:text-[9px] font-mono tracking-[0.2em] py-1 md:py-1.5 px-3 md:px-4 rounded-full transition-all cursor-pointer"
                          >
                            EXPLORE PROJECTS
                          </button>
                        )}
                      </div>

                      {/* Card Right: Media visual or Form */}
                      <div className="w-[80px] sm:w-[100px] md:w-[130px] shrink-0 h-full relative rounded-lg overflow-hidden border border-white/5 bg-black/40 flex items-center justify-center">
                        {service.isOtherForm ? (
                          <div className="w-full p-1.5 md:p-2 flex flex-col justify-between h-full space-y-1.5 md:space-y-2">
                            <textarea
                              placeholder="Describe your vision..."
                              className="w-full flex-1 bg-white/5 border border-white/10 rounded p-1 text-[8px] md:text-[9px] text-white placeholder-white/30 focus:outline-none focus:border-gold-500 resize-none"
                              value={customVision}
                              onChange={(e) => setCustomVision(e.target.value)}
                            />
                            <button
                              onClick={handleCustomVisionSubmit}
                              className="w-full bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black text-[8px] md:text-[9px] font-mono font-bold tracking-[0.1em] py-1 md:py-1.5 rounded transition-all cursor-pointer"
                            >
                              {customSubmitted ? "RECEIVED ✓" : "SUBMIT"}
                            </button>
                          </div>
                        ) : (
                          <div className="relative w-full h-full group">
                            <img
                              src={service.media}
                              alt={service.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40" />
                            <div className="absolute bottom-1 left-1 right-1 text-[5px] md:text-[6px] font-mono text-white/50 tracking-tight bg-black/60 px-1 py-0.5 rounded text-center">
                              {service.specs}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SCENE 4.5: THE MAKER */}
          <div className={`text-scene-maker absolute inset-0 flex flex-col items-center justify-center text-center px-6 opacity-0 translate-y-10 pt-16 md:pt-0 ${activeStage === "maker" ? "pointer-events-auto" : "pointer-events-none"}`} style={{ display: 'none' }}>
            {/* Soft radial scrim - kills 3D camera bleed-through */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.38) 60%, transparent 100%)' }} />
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-[11px] tracking-[0.4em] font-medium text-gold-400 uppercase mb-4">
                CHAPTER III.V &#x2022; THE MAKER
              </span>
              <h2
                className="font-serif text-3xl md:text-5xl tracking-[0.15em] font-semibold uppercase leading-snug max-w-3xl"
                style={{ color: 'var(--scene-text)', textShadow: '0 2px 32px rgba(0,0,0,0.8), 0 0 60px rgba(0,0,0,0.5)' }}
              >
                I DIDN&apos;T BUILD THIS BECAUSE I KNOW CAMERAS
              </h2>
              <p
                className="max-w-lg text-sm md:text-[15px] tracking-wide leading-[1.85] mt-6"
                style={{ color: 'rgba(255,255,255,0.88)', textShadow: '0 1px 12px rgba(0,0,0,0.95), 0 2px 24px rgba(0,0,0,0.7)' }}
              >
                I built it because I know how it feels, the second before you press the shutter. That half-breath. That instinct. That terror that the moment might slip past you. The Lens exists because some things are worth freezing forever.
              </p>
            </div>
          </div>

          {/* SCENE 5: THE INTERACTIVE CAMERA GALLERY */}
          <div className={`text-scene-5 absolute inset-0 flex flex-col justify-start md:justify-between pt-14 md:pt-16 pb-4 md:pb-10 px-4 md:px-6 gap-3 md:gap-0 opacity-0 translate-y-10 w-full max-w-6xl mx-auto z-30 ${activeStage === "gallery" ? "pointer-events-auto" : "pointer-events-none"}`} style={{ display: 'none' }}>
            {/* Top Area: Header and release shutter button */}
            <div className="text-center space-y-1.5 md:space-y-2.5 z-20 max-w-xl mx-auto mt-0 md:mt-4 px-2 md:px-4">
              <span className="text-[9px] md:text-[11px] tracking-[0.4em] font-medium text-gold-400 uppercase">
                CHAPTER IV • THE SHUTTER
              </span>
              <h2 className="font-serif text-[1.7rem] md:text-5xl tracking-[0.12em] font-bold uppercase leading-none" style={{ color: 'var(--scene-text)', textShadow: '0 2px 16px rgba(0,0,0,0.7)' }}>
                FREEZE A MOMENT
              </h2>
              <p className="text-[11px] md:text-[11px] tracking-wide leading-relaxed max-w-md mx-auto pt-1" style={{ color: 'rgba(255,255,255,0.82)' }}>
                <span className="hidden md:inline">This is where time stands still. Click directly on the 3D camera lens or trigger the physical shutter button below to snap real-time photos and unlock our session portfolio.</span>
                <span className="md:hidden">Tap the 3D lens or release the shutter below to snap photos and unlock our session portfolio.</span>
              </p>

              <div className="flex flex-col items-center space-y-2 md:space-y-3 pt-1 md:pt-2">
                <div className={`flex flex-row items-center justify-center gap-2.5 md:gap-4 z-30 relative w-full max-w-md sm:max-w-none ${activeStage === "gallery" ? "pointer-events-auto" : "pointer-events-none"}`}>
                  <button
                    onClick={triggerShutter}
                    className="w-1/2 sm:w-auto relative overflow-visible z-50 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black px-3.5 md:px-8 py-2.5 md:py-3 rounded-full text-[8.5px] md:text-[10px] font-mono font-bold tracking-[0.15em] md:tracking-[0.25em] flex items-center justify-center space-x-1 md:space-x-2 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(251,191,36,0.35)] cursor-pointer after:absolute after:inset-[-20px] after:content-['']"
                  >
                    <Camera className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                    <span>RELEASE SHUTTER</span>
                  </button>

                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                        window.scrollTo({
                          top: 0.85 * docHeight,
                          behavior: "smooth"
                        });
                      }
                    }}
                    className="w-1/2 sm:w-auto relative overflow-visible z-50 border border-white/20 hover:border-gold-500/80 bg-zinc-950/60 hover:bg-zinc-900/60 text-white/80 hover:text-white px-3.5 md:px-8 py-2.5 md:py-3 rounded-full text-[8.5px] md:text-[10px] font-mono font-bold tracking-[0.15em] md:tracking-[0.25em] transition-all hover:scale-105 active:scale-95 shadow-[0_4px_15px_rgba(0,0,0,0.5)] cursor-pointer after:absolute after:inset-[-20px] after:content-['']"
                  >
                    <span>EXPLORE ALL WORK</span>
                  </button>
                </div>

                <div className="text-[8px] md:text-[9px] font-mono tracking-widest text-gold-400/90 uppercase">
                  CAPTURED: {unlockedPhotos.length} / 4 PHOTOS
                </div>
              </div>
            </div>

            {/* Bottom Area: Photo deck grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4 w-full z-20 max-h-[42vh] md:max-h-[32vh] overflow-y-auto no-scrollbar mb-0 md:mb-20">
              {PHOTO_POOL.map((photo, index) => {
                const isUnlocked = unlockedPhotos.some((p) => p.id === photo.id);
                return (
                  <div
                    key={photo.id}
                    className={`relative aspect-[4/3] rounded-lg overflow-hidden border transition-all duration-500 ${isUnlocked
                        ? "border-white/10 bg-zinc-950/40 hover:border-gold-500/80 shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
                        : "border-dashed border-white/10 bg-black/40 skeleton-shimmer flex flex-col items-center justify-center"
                      }`}
                  >
                    {isUnlocked ? (
                      <div className="group absolute inset-0 cursor-pointer" onClick={() => setActiveLightbox(photo)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={photo.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        {/* Film Bezel corner crops */}
                        <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t border-l border-gold-500/70" />
                        <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t border-r border-gold-500/70" />
                        <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b border-l border-gold-500/70" />
                        <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r border-gold-500/70" />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-300 text-center p-3">
                          <Eye className="w-6 h-6 text-gold-400 mb-2" />
                          <span className="font-serif text-[11px] tracking-widest text-white uppercase">{photo.title}</span>
                          <span className="text-[8px] font-mono text-white/50 tracking-wider mt-1">{photo.stats}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-2 px-3">
                        <Lock className="w-5 h-5 text-white/20 mx-auto animate-pulse" />
                        <div className="text-[9px] font-mono tracking-widest text-white/30 uppercase">
                          SLOT {index + 1}
                        </div>
                        <div className="text-[8px] text-white/25 tracking-wider font-mono">
                          <span className="hidden md:inline">CLICK CAMERA TO SNAP</span>
                          <span className="md:hidden">TAP LENS TO SNAP</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SCENE 6: THE LEGACY TEXT & PHOTO SPLIT LAYOUT */}
          <div className={`text-scene-6 absolute inset-0 flex flex-col md:flex-row items-center md:items-center justify-start md:justify-between pt-14 md:pt-12 pb-6 md:py-12 px-5 md:px-8 gap-4 md:gap-0 overflow-y-auto md:overflow-hidden opacity-0 translate-y-10 w-full max-w-6xl mx-auto ${activeStage === "legacy" ? "pointer-events-auto" : "pointer-events-none"}`} style={{ display: 'none' }}>
            {/* Left Column: Narrative Copy */}
            <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left space-y-2 md:space-y-5 relative">
              {/* Soft left-side scrim behind text */}
              <div className="absolute -inset-6 md:-inset-10 pointer-events-none rounded-2xl" style={{ background: 'radial-gradient(ellipse 90% 80% at 30% 50%, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 70%, transparent 100%)' }} />
              <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left space-y-2 md:space-y-5">
                <span className="text-[9px] md:text-[11px] tracking-[0.4em] font-medium text-gold-400 uppercase">
                  CHAPTER V &#x2022; THE PROMISE
                </span>
                <h2
                  className="font-serif text-[1.65rem] md:text-5xl tracking-[0.08em] font-semibold uppercase leading-tight"
                  style={{ color: 'var(--scene-text)', textShadow: '0 2px 24px rgba(0,0,0,0.7), 0 0 48px rgba(0,0,0,0.4)' }}
                >
                  YOUR LEGACY,<br />PRESERVED FOREVER
                </h2>
                <h3
                  className="font-serif text-lg md:text-2xl tracking-[0.18em] font-light text-gold-400 uppercase"
                  style={{ textShadow: '0 1px 16px rgba(0,0,0,0.6)' }}
                >
                  Freezing History in Silver &#x26; Light.
                </h3>
                <p
                  className="max-w-md text-sm md:text-[15px] tracking-wide leading-[1.85]"
                  style={{ color: 'rgba(255,255,255,0.88)', textShadow: '0 1px 10px rgba(0,0,0,0.95), 0 2px 20px rgba(0,0,0,0.7)' }}
                >
                  <span className="hidden md:inline">This is why we do what we do. Long after the occasion ends, the laughter fades, and the moment becomes a memory, the photograph remains. It is a tangible bridge between generations, outliving words, thoughts, and time.</span>
                  <span className="md:hidden text-[13.5px] leading-relaxed">Long after the laughter fades and the moment becomes a memory, the photograph remains, a tangible bridge outliving words, thoughts, and time.</span>
                </p>
              </div>
            </div>

            {/* Right Column: High-Fidelity Legacy Photograph Frame */}
            <div className="w-full md:w-1/2 flex justify-center md:justify-end mt-2 md:mt-0">
              <div className="relative border p-1.5 md:p-2.5 rounded shadow-[0_10px_35px_rgba(0,0,0,0.95)] max-w-[280px] sm:max-w-xs md:max-w-sm w-full group overflow-hidden transition-all duration-500 hover:border-gold-500/50" style={{ borderColor: 'var(--panel-border)', background: 'var(--panel-bg)' }}>
                {/* Crop Bracket Marks */}
                <div className="absolute top-4 left-4 w-3.5 h-3.5 border-t-2 border-l-2 border-gold-500/70" />
                <div className="absolute top-4 right-4 w-3.5 h-3.5 border-t-2 border-r-2 border-gold-500/70" />
                <div className="absolute bottom-4 left-4 w-3.5 h-3.5 border-b-2 border-l-2 border-gold-500/70" />
                <div className="absolute bottom-4 right-4 w-3.5 h-3.5 border-b-2 border-r-2 border-gold-500/70" />

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/legacy_hero.png"
                  alt="Legacy Portrait"
                  className="w-full aspect-[4/3] object-cover rounded transition-transform duration-750 group-hover:scale-[1.03]"
                />

                <div className="text-center pt-3.5 space-y-0.5">
                  <span className="text-[8px] font-mono tracking-[0.3em] text-gold-500/80">LEGACY NARRATIVE</span>
                  <p className="font-serif text-[10px] tracking-widest text-white/80 uppercase">THE ETERNAL CONNECTION</p>
                </div>
              </div>
            </div>
          </div>

          {/* SCENE 7: CTA BOOKING FORM (Interactive) */}
          <div className={`text-scene-7 absolute inset-0 flex flex-col items-center justify-center px-4 md:px-6 opacity-0 translate-y-10 ${activeStage === "booking" ? "pointer-events-auto" : "pointer-events-none"}`} style={{ display: 'none' }}>
            <div className="glass max-w-[320px] sm:max-w-md w-full p-5 md:p-8 rounded-xl shadow-2xl relative">

              {submitted ? (
                <div className="text-center py-8 md:py-12 space-y-3 md:space-y-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gold-500/10 border border-gold-500 flex items-center justify-center mx-auto">
                    <Calendar className="w-5 h-5 md:w-6 md:h-6 text-gold-400" />
                  </div>
                  <h3 className="font-serif text-lg md:text-xl tracking-[0.15em]" style={{ color: 'var(--scene-text)' }}>DATE REQUESTED</h3>
                  <p className="text-[10px] md:text-[11px] tracking-widest leading-relaxed" style={{ color: 'var(--scene-body)' }}>
                    Our creative studio will review your request. Expect a phone consultation within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4 md:space-y-6">
                  <div className="text-center space-y-1">
                    <h3 className="font-serif text-xl md:text-2xl tracking-[0.2em] text-white font-bold">
                      BEGIN YOUR LEGACY
                    </h3>
                    <p className="text-[8px] md:text-[10px] tracking-[0.2em] text-white/40">
                      SECURE A CINEMATIC SESSION
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Name input */}
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="text"
                        required
                        placeholder="Full Name"
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-xs tracking-wider text-white placeholder-white/30 focus:outline-none focus:border-gold-500 transition-colors"
                      />
                    </div>

                    {/* Email input */}
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="email"
                        required
                        placeholder="Email Address"
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-xs tracking-wider text-white placeholder-white/30 focus:outline-none focus:border-gold-500 transition-colors"
                      />
                    </div>

                    {/* Session Type */}
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <select
                        required
                        defaultValue=""
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-xs tracking-wider text-white placeholder-white/30 focus:outline-none focus:border-gold-500 transition-colors appearance-none cursor-pointer"
                      >
                        <option value="" disabled className="bg-[#111]">Select Session</option>
                        <option value="wedding" className="bg-[#111]">Wedding Legacy</option>
                        <option value="portrait" className="bg-[#111]">Editorial Portrait</option>
                        <option value="fashion" className="bg-[#111]">High-Fashion Shoot</option>
                        <option value="travel" className="bg-[#111]">Destination Travel</option>
                      </select>
                    </div>

                    {/* Message input */}
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-white/30" />
                      <textarea
                        rows={3}
                        placeholder="Tell us your vision..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-xs tracking-wider text-white placeholder-white/30 focus:outline-none focus:border-gold-500 transition-colors resize-none"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black text-xs font-bold tracking-[0.25em] py-3 rounded-lg flex items-center justify-center space-x-2 transition-all shadow-[0_4px_15px_rgba(217,119,6,0.3)] hover:shadow-[0_4px_20px_rgba(251,191,36,0.5)] cursor-pointer"
                  >
                    <span>SECURE YOUR DATE</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>

            <div className="mt-8 text-[9px] tracking-[0.3em] text-white/20 font-mono text-center flex flex-col items-center justify-center gap-1.5 pointer-events-auto">
              <span>© {new Date().getFullYear()} THE LENS STUDIO. ALL RIGHTS RESERVED.</span>
              <a
                href="https://www.sitansu.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-400/50 hover:text-gold-400 transition-colors pointer-events-auto"
              >
                DESIGNED & DEVELOPED BY SITANSU
              </a>
            </div>
          </div>

        </div>
      </main>

      {/* 7. Fullscreen Luxury Photo Lightbox */}
      {activeLightbox && (
        <div className="fixed inset-0 bg-[#020202]/95 z-[99999] flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in pointer-events-auto">
          {/* Close button */}
          <button
            onClick={() => setActiveLightbox(null)}
            className="absolute top-6 right-6 w-10 h-10 border border-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:border-gold-500 bg-white/5 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="max-w-4xl w-full flex flex-col items-center justify-center space-y-4">
            {/* Viewfinder frame in lightbox */}
            <div className="relative border border-white/15 p-2 rounded bg-black/60 shadow-[0_0_50px_rgba(0,0,0,0.9)] max-h-[70vh] flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeLightbox.url}
                alt={activeLightbox.title}
                className="max-h-[65vh] object-contain rounded"
              />
              {/* Gold crop marks */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-gold-500" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-gold-500" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-gold-500" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-gold-500" />
            </div>

            <div className="text-center space-y-1">
              <span className="text-[10px] font-mono tracking-widest text-gold-400">{activeLightbox.category}</span>
              <h3 className="font-serif text-2xl tracking-widest text-white uppercase">{activeLightbox.title}</h3>
              <p className="text-xs font-mono text-white/50 tracking-wider">{activeLightbox.stats}</p>
            </div>
          </div>
        </div>
      )}

      {/* 8. Fullscreen Previous Project Explorer Lightbox */}
      {activeExplorerIdx !== null && (
        <div className="fixed inset-0 bg-[#020202]/95 z-[99999] flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in pointer-events-auto">
          {/* Close button */}
          <button
            onClick={() => setActiveExplorerIdx(null)}
            className="absolute top-6 right-6 w-10 h-10 border border-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:border-gold-500 bg-white/5 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Project Details Panel */}
          {(() => {
            const project = MOCK_PROJECTS.find(p => p.serviceIdx === activeExplorerIdx);
            if (!project) return null;
            return (
              <div className="max-w-3xl w-full flex flex-col items-center justify-center space-y-4 animate-scale-up">
                <div className="relative border border-white/15 p-2 rounded bg-black/60 shadow-[0_0_50px_rgba(0,0,0,0.9)] max-h-[70vh] flex items-center justify-center overflow-hidden">
                  <img
                    src={project.img}
                    alt={project.title}
                    className="max-h-[60vh] object-contain rounded"
                  />
                  {/* Gold crop marks */}
                  <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-gold-500" />
                  <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-gold-500" />
                  <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-gold-500" />
                  <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-gold-500" />
                </div>

                <div className="text-center space-y-1">
                  <span className="text-[9px] font-mono tracking-widest text-gold-400 uppercase">
                    PREVIOUS PROJECT • {project.location}
                  </span>
                  <h3 className="font-serif text-xl md:text-2xl tracking-widest text-white uppercase">{project.title}</h3>
                  <p className="text-[10px] font-mono text-white/50 tracking-wider">CAPTURED WITH: {project.lens}</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}
      {/* 9. Sticky Grab CTA + Enquiry Modal */}
      <GrabModal />
    </LenisProvider>
  );
}
