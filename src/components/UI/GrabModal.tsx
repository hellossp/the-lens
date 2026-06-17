"use client";

import { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { X, Send, Camera, Sparkles, ChevronDown } from "lucide-react";

type FormState = {
  name: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  vision: string;
};

const SERVICES = [
  "Weddings & Elopements",
  "Editorial Portraits",
  "Corporate Events",
  "Commercial Campaigns",
  "Film & Cinematic",
  "Drone Aerial",
  "Post-Processing",
  "Custom Vision",
];

export default function GrabModal() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    service: "",
    date: "",
    vision: "",
  });
  const overlayRef = useRef<HTMLDivElement>(null);

  // Delay mount by 2.5s to let the cinematic preloader finish first
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 2500);
    return () => clearTimeout(t);
  }, []);

  // Periodic pulse to attract attention
  useEffect(() => {
    const interval = setInterval(() => {
      setPulsing(true);
      setTimeout(() => setPulsing(false), 1000);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setOpen(false);
      setForm({ name: "", email: "", phone: "", service: "", date: "", vision: "" });
    }, 3500);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) setOpen(false);
  };

  // Lock body scroll while modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!mounted) return null;

  const content = (
    <>
      {/* ─── Sticky Floating CTA Button ─── */}
      <button
        id="grab-cta-btn"
        onClick={() => setOpen(true)}
        aria-label="Open enquiry form"
        className={`grab-cta-btn ${pulsing ? "grab-cta-pulse" : ""}`}
      >
        <span className="grab-cta-icon">
          <Sparkles className="w-3.5 h-3.5" />
        </span>
        <span className="grab-cta-label">Grab one for yourself</span>
        <span className="grab-cta-arrow">→</span>
      </button>

      {/* ─── Cinematic Modal Overlay ─── */}
      {open && (
        <div
          ref={overlayRef}
          onClick={handleBackdropClick}
          className="grab-modal-overlay"
        >
          <div className="grab-modal">
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              className="grab-modal-close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="grab-modal-header">
              <div className="grab-modal-badge">
                <Camera className="w-3 h-3" />
                <span>THE LENS STUDIO</span>
              </div>
              <h2 className="grab-modal-title">Grab One For Yourself</h2>
              <p className="grab-modal-subtitle">
                Tell us about your vision. We&apos;ll shape the light around it.
              </p>
              <div className="grab-modal-rule" />
            </div>

            {/* Form / Success */}
            {!submitted ? (
              <form onSubmit={handleSubmit} className="grab-modal-form">
                <div className="grab-form-row">
                  <div className="grab-form-field">
                    <label htmlFor="grab-name">Full Name *</label>
                    <input
                      id="grab-name"
                      name="name"
                      type="text"
                      required
                      placeholder="Your name"
                      value={form.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grab-form-field">
                    <label htmlFor="grab-email">Email *</label>
                    <input
                      id="grab-email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grab-form-row">
                  <div className="grab-form-field">
                    <label htmlFor="grab-phone">Phone</label>
                    <input
                      id="grab-phone"
                      name="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grab-form-field">
                    <label htmlFor="grab-date">Preferred Date</label>
                    <input
                      id="grab-date"
                      name="date"
                      type="date"
                      value={form.date}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grab-form-field grab-form-field--full">
                  <label htmlFor="grab-service">What are you looking for? *</label>
                  <div className="grab-select-wrapper">
                    <select
                      id="grab-service"
                      name="service"
                      required
                      value={form.service}
                      onChange={handleChange}
                    >
                      <option value="">Select a service</option>
                      {SERVICES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown className="grab-select-icon w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="grab-form-field grab-form-field--full">
                  <label htmlFor="grab-vision">Your Vision</label>
                  <textarea
                    id="grab-vision"
                    name="vision"
                    rows={3}
                    placeholder="Describe the story you want captured — a sunset elopement in Tuscany, a high-fashion editorial, anything..."
                    value={form.vision}
                    onChange={handleChange}
                  />
                </div>

                <button type="submit" className="grab-submit-btn" id="grab-submit">
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Enquiry</span>
                </button>

                <p className="grab-form-note">
                  This is a sample site — no data is actually sent.
                </p>
              </form>
            ) : (
              <div className="grab-success">
                <div className="grab-success-ring">
                  <Camera className="w-8 h-8" />
                </div>
                <h3>Enquiry Received.</h3>
                <p>We&apos;ll reach out within 24 hours to craft your story.</p>
                <div className="grab-success-shutter">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  // Use a React Portal to render directly into document.body.
  // This escapes any CSS stacking contexts from parent elements
  // (the Lenis scroll wrapper, sticky overlays, etc.) so that
  // position: fixed and z-index work correctly at all scroll positions.
  return ReactDOM.createPortal(content, document.body);
}
