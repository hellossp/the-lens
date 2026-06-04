"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import LenisProvider from "@/components/UI/LenisProvider";
import CustomCursor from "@/components/UI/CustomCursor";
import Overlay from "@/components/UI/Overlay";
import { Camera, Calendar, ArrowRight, User, Mail, MessageSquare, Lock, Eye, X } from "lucide-react";

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

// Synthesize a camera shutter click on the fly using Web Audio API
const playShutterSound = () => {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // 1. Shutter noise burst (120ms)
    const bufferSize = ctx.sampleRate * 0.12;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    
    // Filter to simulate mechanical lens clicks
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 1200;
    bandpass.Q.value = 3;

    // Volume envelope
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.11);
    
    noiseSource.connect(bandpass);
    bandpass.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    noiseSource.start();
  } catch (err) {
    console.error("Synthesizer error", err);
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

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

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
        className={`fixed inset-0 bg-white z-[9999] pointer-events-none transition-opacity duration-300 ${
          flash ? "opacity-95" : "opacity-0"
        }`}
      />

      {/* 2. Cinematic Preloader */}
      <div
        className={`fixed inset-0 bg-[#050505] flex flex-col items-center justify-center z-[999] transition-opacity duration-1000 ease-in-out pointer-events-none ${
          loading ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex flex-col items-center space-y-6">
          <div className="relative flex items-center justify-center w-20 h-20">
            <div className="absolute inset-0 rounded-full border-2 border-white/5 border-t-gold-500 animate-spin" />
            <Camera className="w-8 h-8 text-gold-400 animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="font-serif text-2xl tracking-[0.3em] text-white">THE LENS</h2>
            <p className="text-[10px] tracking-[0.25em] text-white/40">CALIBRATING GLASS ELEMENTS...</p>
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
          
          {/* SCENE 1: THE LENS TEXT */}
          <div className="text-scene-1 absolute inset-0 flex flex-col items-center justify-center text-center px-6 opacity-0 translate-y-10 pointer-events-none">
            <span className="text-[11px] md:text-[13px] tracking-[0.4em] font-medium text-gold-400 uppercase mb-4">
              A PORTAL BETWEEN MOMENTS
            </span>
            <h1 className="font-serif text-5xl md:text-8xl tracking-[0.2em] font-bold text-white uppercase leading-none">
              THE LENS
            </h1>
            <p className="max-w-md text-xs md:text-sm tracking-widest text-white/50 leading-relaxed mt-6">
              A high-precision instrument of light, freezing raw human emotion in a single fraction of a second.
            </p>
          </div>

          {/* SCENE 2: THE LIGHT TEXT */}
          <div className="text-scene-2 absolute inset-0 flex flex-col items-center justify-center text-center px-6 opacity-0 translate-y-10 pointer-events-none">
            <span className="text-[11px] tracking-[0.4em] font-medium text-gold-400 uppercase mb-4">
              CHAPTER I
            </span>
            <h2 className="font-serif text-4xl md:text-6xl tracking-[0.15em] font-semibold text-white uppercase leading-snug">
              EVERY MEMORY<br />BEGINS WITH LIGHT
            </h2>
            <p className="max-w-lg text-xs md:text-sm tracking-widest text-white/45 leading-relaxed mt-6">
              Rays refract through double-convex glass, scattering volumetric patterns onto the physical sensor.
            </p>
          </div>

          {/* SCENE 3: THE FOCUS TEXT */}
          <div className="text-scene-3 absolute inset-0 flex flex-col items-center justify-center text-center px-6 opacity-0 translate-y-10 pointer-events-none">
            <span className="text-[11px] tracking-[0.4em] font-medium text-gold-400 uppercase mb-4">
              CHAPTER II
            </span>
            <h2 className="font-serif text-4xl md:text-6xl tracking-[0.15em] font-semibold text-white uppercase leading-snug">
              A CAMERA RECORDS
            </h2>
            <h3 className="font-serif text-2xl md:text-3xl tracking-[0.15em] font-light text-white/70 uppercase mt-2">
              Focus Creates Meaning
            </h3>
            <p className="max-w-lg text-xs md:text-sm tracking-widest text-white/40 leading-relaxed mt-6">
              As the lens elements separate and slide, the plane of sharp focus locks onto the heart of the subject.
            </p>
          </div>

          {/* SCENE 4: THE MEMORY TEXT */}
          <div className="text-scene-4 absolute inset-0 flex flex-col items-center justify-center text-center px-6 opacity-0 translate-y-10 pointer-events-none">
            <span className="text-[11px] tracking-[0.4em] font-medium text-gold-400 uppercase mb-4">
              CHAPTER III
            </span>
            <h2 className="font-serif text-4xl md:text-6xl tracking-[0.15em] font-semibold text-white uppercase">
              CAPTURED MOMENTS
            </h2>
            <p className="max-w-md text-xs md:text-sm tracking-widest text-white/40 leading-relaxed mt-6">
              Time dilates. Dynamic motion freezes, immortalizing weddings, editorial portraits, and family legacies.
            </p>
            <div className="flex space-x-8 mt-8 text-[9px] tracking-[0.25em] text-white/35 font-mono">
              <span>I. THE VOWS</span>
              <span>II. THE SOUL</span>
              <span>III. THE WARMTH</span>
            </div>
          </div>

          {/* SCENE 5: THE INTERACTIVE CAMERA GALLERY */}
          <div className="text-scene-5 absolute inset-0 flex flex-col justify-between py-10 px-6 opacity-0 translate-y-10 w-full max-w-6xl mx-auto pointer-events-none">
            {/* Top Area: Header and release shutter button */}
            <div className="text-center space-y-2.5 z-20 pointer-events-auto max-w-xl mx-auto mt-4">
              <span className="text-[10px] md:text-[11px] tracking-[0.4em] font-medium text-gold-400 uppercase">
                CHAPTER IV • THE INTERACTIVE CAMERA
              </span>
              <h2 className="font-serif text-3xl md:text-5xl tracking-[0.15em] font-bold text-white uppercase leading-none">
                SNAP THE GALLERY
              </h2>
              <p className="text-[10px] md:text-[11px] tracking-widest text-white/40 leading-relaxed max-w-md mx-auto pt-1">
                Trigger the shutter to capture photos and unlock your session gallery! Click directly on the 3D camera lens or use the physical shutter button below.
              </p>
              
              <div className="flex flex-col items-center space-y-2 pt-1">
                <button
                  onClick={triggerShutter}
                  className="bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-black px-6 py-2 rounded-full text-[9px] font-mono font-bold tracking-[0.25em] flex items-center space-x-2 transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(251,191,36,0.3)] cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>RELEASE SHUTTER</span>
                </button>
                <div className="text-[9px] font-mono tracking-widest text-gold-400/90 uppercase">
                  CAPTURED: {unlockedPhotos.length} / 4 PHOTOS
                </div>
              </div>
            </div>

            {/* Bottom Area: Photo deck grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full z-20 pointer-events-auto max-h-[32vh] overflow-y-auto no-scrollbar mb-4">
              {PHOTO_POOL.map((photo, index) => {
                const isUnlocked = unlockedPhotos.some((p) => p.id === photo.id);
                return (
                  <div
                    key={photo.id}
                    className={`relative aspect-[3/4] rounded-lg overflow-hidden border transition-all duration-500 ${
                      isUnlocked
                        ? "border-white/10 bg-zinc-950/40 hover:border-gold-500/80 shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
                        : "border-dashed border-white/10 bg-black/40 flex flex-col items-center justify-center"
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
                        <div className="text-[8px] text-white/20 tracking-wider">
                          CLICK CAMERA TO SNAP
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SCENE 6: THE LEGACY TEXT & PHOTO SPLIT LAYOUT */}
          <div className="text-scene-6 absolute inset-0 flex flex-col md:flex-row items-center justify-between py-12 px-8 opacity-0 translate-y-10 w-full max-w-6xl mx-auto pointer-events-none">
            {/* Left Column: Narrative Copy */}
            <div className="md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left space-y-4">
              <span className="text-[11px] tracking-[0.4em] font-medium text-gold-400 uppercase">
                CHAPTER V
              </span>
              <h2 className="font-serif text-3xl md:text-5xl tracking-[0.15em] font-semibold text-white uppercase leading-snug">
                LONG AFTER THE<br />MOMENT IS GONE,
              </h2>
              <h3 className="font-serif text-xl md:text-2xl tracking-[0.2em] font-light text-gold-400 uppercase">
                The Photograph Remains.
              </h3>
              <p className="max-w-md text-xs md:text-sm tracking-widest text-white/40 leading-relaxed">
                A tangible legacy that connects generations, outliving words, thoughts, and time.
              </p>
            </div>

            {/* Right Column: High-Fidelity Legacy Photograph Frame */}
            <div className="md:w-1/2 flex justify-center md:justify-end mt-6 md:mt-0 pointer-events-auto">
              <div className="relative border border-white/10 p-2.5 rounded bg-zinc-950/60 shadow-[0_10px_35px_rgba(0,0,0,0.95)] max-w-sm w-full group overflow-hidden transition-all duration-500 hover:border-gold-500/50">
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
          <div className="text-scene-7 absolute inset-0 flex flex-col items-center justify-center px-6 opacity-0 translate-y-10 pointer-events-none">
            <div className="glass max-w-md w-full p-8 rounded-xl shadow-2xl relative">
              
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-gold-500/10 border border-gold-500 flex items-center justify-center mx-auto">
                    <Calendar className="w-6 h-6 text-gold-400" />
                  </div>
                  <h3 className="font-serif text-xl tracking-[0.15em] text-white">DATE REQUESTED</h3>
                  <p className="text-[11px] tracking-widest text-white/50 leading-relaxed">
                    Our creative studio will review your request. Expect a phone consultation within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-6">
                  <div className="text-center space-y-1">
                    <h3 className="font-serif text-2xl tracking-[0.2em] text-white font-bold">
                      BEGIN YOUR STORY
                    </h3>
                    <p className="text-[10px] tracking-[0.2em] text-white/40">
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
            
            <div className="mt-8 text-[9px] tracking-[0.3em] text-white/20 font-mono text-center">
              © {new Date().getFullYear()} THE LENS STUDIO. ALL RIGHTS RESERVED.
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
    </LenisProvider>
  );
}
