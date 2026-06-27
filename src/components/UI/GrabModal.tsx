"use client";

import { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { X, Send, Camera, Sparkles, ChevronDown, CheckCircle, Check } from "lucide-react";
import { trackEvent } from "@/utils/analytics";

const WEB3FORMS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY || "abadc18b-7389-42d8-88e5-b0e01f2ac477";

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Armenia", "Australia",
  "Austria", "Azerbaijan", "Bahrain", "Bangladesh", "Belgium", "Bolivia",
  "Bosnia and Herzegovina", "Brazil", "Bulgaria", "Cambodia", "Canada", "Chile",
  "China", "Colombia", "Croatia", "Cyprus", "Czech Republic", "Denmark", "Ecuador",
  "Egypt", "Estonia", "Ethiopia", "Finland", "France", "Georgia", "Germany",
  "Ghana", "Greece", "Hungary", "India", "Indonesia", "Iran", "Iraq", "Ireland",
  "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya",
  "Kuwait", "Latvia", "Lebanon", "Lithuania", "Luxembourg", "Malaysia", "Mexico",
  "Moldova", "Morocco", "Nepal", "Netherlands", "New Zealand", "Nigeria", "Norway",
  "Oman", "Pakistan", "Panama", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Saudi Arabia", "Serbia", "Singapore",
  "Slovakia", "Slovenia", "South Africa", "South Korea", "Spain", "Sri Lanka",
  "Sweden", "Switzerland", "Taiwan", "Tanzania", "Thailand", "Turkey",
  "UAE", "Uganda", "Ukraine", "United Kingdom", "United States", "Uruguay",
  "Uzbekistan", "Venezuela", "Vietnam", "Zimbabwe",
];

type FormState = {
  name: string;
  email: string;
  phone: string;
  country: string;
  studio: string;
  website: string;
  instagram: string;
};

export default function GrabModal() {
  const [open, setOpen] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    country: "",
    studio: "",
    website: "",
    instagram: "",
  });
  const overlayRef = useRef<HTMLDivElement>(null);

  // Delay mount by 2.5s to let the cinematic preloader finish first
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 2500);
    return () => clearTimeout(t);
  }, []);

  // Periodic pulse to attract attention every 6s
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
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        access_key: WEB3FORMS_KEY,
        subject: `New Website Enquiry — ${form.name}`,
        from_name: "The Lens Studio",
        name: form.name,
        email: form.email,
        phone: form.phone || "Not provided",
        country: form.country,
        "business_or_studio_name": form.studio || "Not provided",
        "website_url": form.website || "Not provided",
        "instagram_profile": form.instagram,
        "package": "Starting at $250",
      };

      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
        // Track form submit
        trackEvent("Lead", {
          content_name: "Web3Forms Website Enquiry",
          country: form.country,
          studio: form.studio || "Not provided",
        });
      } else {
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset after close animation
    setTimeout(() => {
      setSubmitted(false);
      setError("");
      setForm({
        name: "", email: "", phone: "", country: "",
        studio: "", website: "", instagram: "",
      });
    }, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) handleClose();
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
        onClick={() => {
          setOpen(true);
          trackEvent("Schedule", { content_name: "Enquiry Modal Opened" });
        }}
        aria-label="Open enquiry form"
        className={`grab-cta-btn ${pulsing ? "grab-cta-pulse" : ""}`}
      >
        <span className="grab-cta-icon">
          <Sparkles className="w-3.5 h-3.5" />
        </span>
        <span className="grab-cta-label">GET YOUR WEBSITE</span>
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
            {/* Close button — outside scroll wrapper so it stays pinned */}
            <button
              onClick={handleClose}
              className="grab-modal-close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="grab-modal-scroll" data-lenis-prevent>
            {/* Header */}
            <div className="grab-modal-header">
              <div className="grab-modal-badge">
                <Camera className="w-3 h-3" />
                <span>THE LENS STUDIO</span>
              </div>
              <h2 className="grab-modal-title">LET&apos;S BUILD YOUR WEBSITE</h2>
              <p className="grab-modal-subtitle">
                Tell us about your vision. We&apos;ll shape the light around it.
              </p>
              <div className="grab-modal-rule" />
            </div>

            {/* Form / Success State */}
            {!submitted ? (
              <form onSubmit={handleSubmit} className="grab-modal-form">

                {/* 3-column compact grid: Name | Email | Phone */}
                <div className="grab-form-row grab-form-row--3">
                  <div className="grab-form-field">
                    <label htmlFor="grab-name">Full Name *</label>
                    <input
                      id="grab-name"
                      name="name"
                      type="text"
                      required
                      placeholder="Alex Sharma"
                      value={form.name}
                      onChange={handleChange}
                      disabled={submitting}
                    />
                  </div>
                  <div className="grab-form-field">
                    <label htmlFor="grab-email">Email Address *</label>
                    <input
                      id="grab-email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      disabled={submitting}
                    />
                  </div>
                  <div className="grab-form-field">
                    <label htmlFor="grab-phone">Phone <span className="grab-optional">(opt.)</span></label>
                    <input
                      id="grab-phone"
                      name="phone"
                      type="tel"
                      placeholder="+1 555 000 0000"
                      value={form.phone}
                      onChange={handleChange}
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* 3-column: Country | Studio | Website */}
                <div className="grab-form-row grab-form-row--3">
                  <div className="grab-form-field">
                    <label htmlFor="grab-country">Country *</label>
                    <div className="grab-select-wrapper">
                      <select
                        id="grab-country"
                        name="country"
                        required
                        value={form.country}
                        onChange={handleChange}
                        disabled={submitting}
                      >
                        <option value="">Select country</option>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <ChevronDown className="grab-select-icon w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="grab-form-field">
                    <label htmlFor="grab-studio">Studio / Business Name</label>
                    <input
                      id="grab-studio"
                      name="studio"
                      type="text"
                      placeholder="Golden Frame Co."
                      value={form.studio}
                      onChange={handleChange}
                      disabled={submitting}
                    />
                  </div>
                  <div className="grab-form-field">
                    <label htmlFor="grab-website">Website <span className="grab-optional">(opt.)</span></label>
                    <input
                      id="grab-website"
                      name="website"
                      type="url"
                      placeholder="https://yourstudio.com"
                      value={form.website}
                      onChange={handleChange}
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* Instagram full-width */}
                <div className="grab-form-field grab-form-field--full">
                  <label htmlFor="grab-instagram">Instagram Profile *</label>
                  <div className="grab-instagram-wrapper">
                    <span className="grab-instagram-prefix">@</span>
                    <input
                      id="grab-instagram"
                      name="instagram"
                      type="text"
                      required
                      placeholder="yourstudio"
                      value={form.instagram}
                      onChange={handleChange}
                      disabled={submitting}
                      className="grab-instagram-input"
                    />
                  </div>
                </div>

                {/* Pricing Card */}
                <div className="grab-pricing-card">
                  <div className="grab-pricing-top">
                    <span className="grab-pricing-label">Packages Starting From</span>
                    <span className="grab-pricing-amount">$250</span>
                  </div>

                  {/* Added Features Grid */}
                  <div className="grab-pricing-features">
                    <div className="grab-feature-item">
                      <Check className="w-3.5 h-3.5" />
                      <span>Custom design</span>
                    </div>
                    <div className="grab-feature-item">
                      <Check className="w-3.5 h-3.5" />
                      <span>Mobile responsive</span>
                    </div>
                    <div className="grab-feature-item">
                      <Check className="w-3.5 h-3.5" />
                      <span>Portfolio showcase</span>
                    </div>
                    <div className="grab-feature-item">
                      <Check className="w-3.5 h-3.5" />
                      <span>Lead generation focused</span>
                    </div>
                  </div>

                  <p className="grab-pricing-note">
                    Final quote depends on the required features, integrations, and project scope.
                  </p>
                </div>

                {/* Error message */}
                {error && (
                  <div className="grab-error">
                    <span>⚠ {error}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  className="grab-submit-btn"
                  id="grab-submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="grab-spinner" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>START MY PROJECT →</span>
                    </>
                  )}
                </button>

                <p className="grab-response-time-info">
                  ⚡ We usually respond in less than 24 hours
                </p>

                {/* Closing Statement */}
                <p className="grab-closing-statement">
                  Every website is built using this proven design framework and then customized to match your brand, portfolio, colors, content, and business goals.
                </p>
              </form>
            ) : (
              /* ─── Success State ─── */
              <div className="grab-success">
                <div className="grab-success-ring">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3>Enquiry Received.</h3>
                <p>
                  Thank you, {form.name.split(" ")[0]}! We&apos;ll reach out within 24 hours
                  to craft your perfect website.
                </p>
                <div className="grab-success-shutter">
                  <span />
                  <span />
                  <span />
                </div>
                <button onClick={handleClose} className="grab-success-close-btn">
                  Close
                </button>
              </div>
            )}
            </div>{/* end grab-modal-scroll */}
          </div>
        </div>
      )}
    </>
  );

  return ReactDOM.createPortal(content, document.body);
}
