"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export default function CustomCursor() {
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [hidden, setHidden] = useState(true);

  const [isTouch] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(pointer: coarse)").matches;
  });

  useEffect(() => {
    if (isTouch) return;

    const cursorDot = cursorDotRef.current;
    const cursorRing = cursorRingRef.current;
    if (!cursorDot || !cursorRing) return;

    // Track mouse movement
    const onMouseMove = (e: MouseEvent) => {
      setHidden(false);
      gsap.to(cursorDot, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.08,
        overwrite: "auto",
      });
      gsap.to(cursorRing, {
        x: e.clientX - 16, // offset half the width (32px / 2 = 16px)
        y: e.clientY - 16,
        duration: 0.25,
        overwrite: "auto",
      });
    };

    const onMouseLeave = () => setHidden(true);
    const onMouseEnter = () => setHidden(false);

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    const handleHoverStart = () => setIsHovered(true);
    const handleHoverEnd = () => setIsHovered(false);

    // Watch for elements that should trigger expand state
    const attachHoverEvents = () => {
      const interactives = document.querySelectorAll(
        "a, button, [role='button'], input, textarea, select, .interactive-hover"
      );
      interactives.forEach((el) => {
        el.addEventListener("mouseenter", handleHoverStart);
        el.addEventListener("mouseleave", handleHoverEnd);
      });
    };

    attachHoverEvents();

    // Recheck interactive elements on domestic mutations (useful when lists load dynamically)
    const observer = new MutationObserver(attachHoverEvents);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      observer.disconnect();
    };
  }, [isTouch]);

  if (isTouch) return null;

  return (
    <>
      {/* Inner solid dot */}
      <div
        ref={cursorDotRef}
        style={{ transform: "translate(-50%, -50%)" }}
        className={`fixed top-0 left-0 w-1.5 h-1.5 bg-gold-400 rounded-full pointer-events-none z-[9999] transition-opacity duration-300 ${
          hidden ? "opacity-0" : "opacity-100"
        }`}
      />
      {/* Outer elegant ring */}
      <div
        ref={cursorRingRef}
        className={`fixed top-0 left-0 w-8 h-8 border border-white/25 rounded-full pointer-events-none z-[9998] transition-all duration-300 ease-out ${
          hidden ? "opacity-0" : "opacity-100"
        } ${
          isHovered
            ? "scale-150 border-gold-500 bg-gold-500/10 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
            : ""
        }`}
      />
    </>
  );
}
