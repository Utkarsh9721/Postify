// app/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "motion/react";
import ErrorBoundary from "./ErrorBoundary";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";
import Carousel from "@/components/ui/carousel";
import { DiaTextReveal } from "@/components/ui/dia-text-reveal";
import Video from "@/app/assets/de.mp4";
import BlackHole from "@/app/assets/blackHole.mp4";

/* ==========================================================================
   Lazy-loaded heavy components
   ========================================================================== */

const SparklesCore = dynamic(
  () => import("@/components/ui/sparkles").then((m) => m.SparklesCore),
  { ssr: false, loading: () => <div className="h-full w-full" aria-hidden /> }
);

const Globe3D = dynamic(
  () => import("@/components/ui/3d-globe").then((mod) => mod.Globe3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="h-28 w-28 sm:h-40 sm:w-40 animate-pulse rounded-full bg-indigo-500/20" />
      </div>
    ),
  }
);

/* ==========================================================================
   Data
   ========================================================================== */

const globeMarkers = [
  { lat: 40.7128, lng: -74.006, src: "https://ui-avatars.com/api/?name=NY&background=6366f1&color=fff", label: "New York" },
  { lat: 51.5074, lng: -0.1278, src: "https://ui-avatars.com/api/?name=LDN&background=a855f7&color=fff", label: "London" },
  { lat: 35.6762, lng: 139.6503, src: "https://ui-avatars.com/api/?name=TYO&background=ec4899&color=fff", label: "Tokyo" },
  { lat: -33.8688, lng: 151.2093, src: "https://ui-avatars.com/api/?name=SYD&background=14b8a6&color=fff", label: "Sydney" },
  { lat: 28.6139, lng: 77.209, src: "https://ui-avatars.com/api/?name=DEL&background=ef4444&color=fff", label: "New Delhi" },
];

const carouselSlides = [
  { title: "Real-time Chat", button: "Try it", src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80" },
  { title: "Share Moments", button: "Explore", src: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=80" },
  { title: "Discover People", button: "Browse", src: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=80" },
];

const testimonials = [
  { quote: "Postify completely changed how I share my work. Simple, fast, and beautifully designed.", name: "Sarah Johnson", designation: "Product Designer", src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80" },
  { quote: "Finally a social app that doesn't feel bloated. Real-time chat is flawless.", name: "Michael Chen", designation: "Software Engineer", src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" },
  { quote: "The cleanest interface I've used. My engagement has never been higher.", name: "Emma Wilson", designation: "Content Creator", src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80" },
];

const features = [
  {
    title: "Instant messaging",
    body: "Messages arrive the moment you hit send. No refreshing, no waiting, no loading spinners.",
    span: "md:col-span-2",
    accent: "indigo",
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: "Zero ads",
    body: "Your feed, your rules. No promoted posts, no tracking pixels.",
    accent: "pink",
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    title: "End-to-end",
    body: "Private by default. Your data stays yours.",
    accent: "emerald",
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: "Global reach",
    body: "Connect with anyone, anywhere. Postify works in over 40 countries with zero latency.",
    span: "md:col-span-2",
    accent: "cyan",
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
      </svg>
    ),
  },
];

const accentMap: Record<string, { gradient: string; glow: string }> = {
  indigo: { gradient: "from-indigo-500 to-purple-600", glow: "bg-indigo-500/10 group-hover:bg-indigo-500/20" },
  pink: { gradient: "from-pink-500 to-rose-600", glow: "bg-pink-500/10 group-hover:bg-pink-500/20" },
  emerald: { gradient: "from-emerald-500 to-teal-600", glow: "bg-emerald-500/10 group-hover:bg-emerald-500/20" },
  cyan: { gradient: "from-cyan-500 to-blue-600", glow: "bg-cyan-500/10 group-hover:bg-cyan-500/20" },
};

/* ==========================================================================
   Hooks
   ========================================================================== */

function useNarrow(query = "(max-width: 767px)") {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    const sync = () => setNarrow(m.matches);
    sync();
    m.addEventListener("change", sync);
    return () => m.removeEventListener("change", sync);
  }, [query]);
  return narrow;
}

function useInViewOnce<T extends HTMLElement>(rootMargin = "400px") {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, rootMargin]);
  return [ref, seen] as const;
}

function useInViewPlayback<T extends HTMLVideoElement>(rootMargin = "200px") {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { v.pause(); return; }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) v.play().catch(() => { });
        else v.pause();
      },
      { rootMargin, threshold: 0.01 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [rootMargin]);
  return ref;
}

/* ==========================================================================
   Page
   ========================================================================== */

export default function Home() {
  const narrow = useNarrow();
  const reduce = useReducedMotion();

  const [globeRef, showGlobe] = useInViewOnce<HTMLDivElement>("400px");
  const [carouselRef, showCarousel] = useInViewOnce<HTMLDivElement>("500px");
  const [testimonialsRef, showTestimonials] = useInViewOnce<HTMLDivElement>("500px");
  const [ctaRef, showSparkles] = useInViewOnce<HTMLDivElement>("400px");

  const heroVideoRef = useInViewPlayback<HTMLVideoElement>("300px");
  const globeVideoRef = useInViewPlayback<HTMLVideoElement>("300px");

  return (
    <main className="min-h-screen bg-black text-white selection:bg-indigo-500/30 overflow-x-hidden">
      {/* ================= HERO ================= */}
      <section className="relative min-h-[100svh] w-full overflow-hidden bg-black">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a0a2e_0%,_#000_70%)]"
        />

        <video
          ref={heroVideoRef}
          className="absolute inset-0 h-full w-full object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          controls={false}
          disablePictureInPicture
          aria-hidden="true"
        >
          <source src={Video} type="video/mp4" />
        </video>

        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80 md:bg-gradient-to-r md:from-black/85 md:via-black/55 md:to-black/30"
        />

        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent"
        />

        <div className="relative z-10 mx-auto flex h-full min-h-[100svh] w-full max-w-7xl flex-col justify-start px-5 pt-24 pb-16 sm:px-6 md:justify-center md:pt-0 lg:px-8">
          <div
            className="max-w-2xl text-center md:text-left"
            style={{ animation: reduce ? "none" : "hero-in 600ms ease-out both" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3.5 py-1.5 mb-5 sm:mb-6 backdrop-blur-md">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-400" />
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-white/80 tracking-wide">
                Now in public beta
              </span>
            </div>

            <div className="flex justify-center md:justify-start">
              <DiaTextReveal
                text="Postify"
                colors={["#6366f1", "#a855f7", "#ec4899", "#818cf8", "#6366f1"]}
                textColor="#ffffff"
                duration={2}
                startOnView={false}
                className="text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-[0.92] text-center md:text-left"
              />
            </div>

            <p className="mt-5 sm:mt-6 text-[15px] sm:text-base md:text-xl text-white/75 max-w-xl mx-auto md:mx-0 leading-relaxed">
              Where conversations happen. Share moments with friends, discover
              people who matter, and stay connected across the globe — all in
              one clean, fast, distraction-free space.
            </p>

            <div className="mt-7 sm:mt-8 grid grid-cols-3 gap-3 max-w-lg mx-auto md:mx-0">
              {[
                { k: "40+", v: "Countries" },
                { k: "Real-time", v: "Messaging" },
                { k: "Private", v: "No ads" },
              ].map((s) => (
                <div
                  key={s.v}
                  className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm px-2.5 py-2.5 sm:px-3 sm:py-3 text-center md:text-left"
                >
                  <p className="text-base sm:text-2xl font-bold text-white leading-none">{s.k}</p>
                  <p className="text-[10px] sm:text-xs text-white/50 mt-1">{s.v}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap justify-center md:justify-start gap-3">
              <a
                href="/login"
                className="inline-flex items-center justify-center w-full sm:w-auto min-h-[48px] rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-neutral-200 active:scale-[0.98]"
              >
                Login
              </a>
              <a
                href="/register"
                className="inline-flex items-center justify-center w-full sm:w-auto min-h-[48px] rounded-full border border-white/25 bg-white/[0.05] backdrop-blur-md px-7 py-3.5 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/[0.1] active:scale-[0.98]"
              >
                Create Account
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-white/40 pointer-events-none">
          <span className="text-[10px] uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent" />
        </div>
      </section>

      {/* ================= GLOBE + BLACK HOLE ================= */}
      <section
        className="relative border-t border-neutral-900 px-4 sm:px-6 py-16 sm:py-24 md:py-32"
        style={{ contentVisibility: "auto", containIntrinsicSize: "1200px" }}
      >
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0f0518_0%,_#000_70%)]"
        />

        <video
          ref={globeVideoRef}
          className="absolute inset-0 h-full w-full object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          controls={false}
          disablePictureInPicture
          aria-hidden="true"
        >
          <source src={BlackHole} type="video/mp4" />
        </video>

        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.62)_0%,_rgba(0,0,0,0.55)_50%,_rgba(0,0,0,0.35)_100%)]"
        />

        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black via-black/60 to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/60 to-transparent"
        />

        <div className="relative z-10 mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8 sm:mb-10 md:mb-16 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3 py-1 mb-4 backdrop-blur-md">
              <span className="text-[10px] font-medium text-neutral-200 uppercase tracking-widest">
                Global Reach
              </span>
            </div>

            <div className="flex justify-center">
              <DiaTextReveal
                text="Connect worldwide"
                textColor="#ffffff"
                duration={1.5}
                className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-center leading-[1.05]"
              />
            </div>

            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-neutral-200 max-w-xl mx-auto px-2">
              Live connections across 5 continents, zero latency.
            </p>
          </div>

          {/* Globe — a narrower square on mobile so the sphere fits fully.
              `overflow-visible` lets the WebGL canvas paint beyond the box. */}
          <motion.div
            ref={globeRef}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "200px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative mx-auto aspect-square w-[80vw] max-w-[320px] sm:aspect-auto sm:h-[380px] sm:w-full sm:max-w-xl md:h-[460px] md:max-w-2xl lg:h-[560px] lg:max-w-3xl touch-none overflow-visible"
          >
            <div
              aria-hidden
              className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,_rgba(77,166,255,0.22)_0%,_transparent_60%)] blur-3xl pointer-events-none"
            />

            {showGlobe ? (
              <ErrorBoundary
                fallback={
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-neutral-600">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                      <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                      </svg>
                    </div>
                    <p className="text-xs">Globe loading...</p>
                  </div>
                }
              >
                <Globe3D
                  markers={globeMarkers}
                  config={{
                    atmosphereColor: "#4da6ff",
                    atmosphereIntensity: 20,
                    bumpScale: 5,
                    autoRotateSpeed: 0.3,
                    enableZoom: false,
                    enablePan: false,
                  }}
                />
              </ErrorBoundary>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="h-28 w-28 sm:h-40 sm:w-40 animate-pulse rounded-full bg-indigo-500/20" />
              </div>
            )}
          </motion.div>

          {/* City chips below the globe — mobile only */}
          <div className="mt-6 flex flex-wrap justify-center gap-2 md:hidden">
            {["New York", "London", "Tokyo", "Sydney", "New Delhi"].map((city) => (
              <span
                key={city}
                className="rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-md px-3 py-1.5 text-[11px] text-neutral-100"
              >
                {city}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section
        className="relative border-t border-neutral-900 px-4 sm:px-6 py-16 sm:py-24 md:py-32"
        style={{ contentVisibility: "auto", containIntrinsicSize: "1600px" }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 sm:mb-16 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/60 px-3 py-1 mb-4">
              <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest">
                Why Postify
              </span>
            </div>

            <div className="flex justify-center">
              <DiaTextReveal
                text="Built for real people"
                textColor="#ffffff"
                duration={1.5}
                className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-center leading-[1.05]"
              />
            </div>

            <p className="mt-4 text-sm sm:text-base text-neutral-400 max-w-xl mx-auto px-2">
              Every feature exists for a reason. No filler, no distractions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {features.map((f, i) => {
              const acc = accentMap[f.accent];
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "150px", amount: 0.1 }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className={`${f.span ?? ""} relative rounded-2xl border border-neutral-800/80 bg-gradient-to-br from-neutral-900/70 to-neutral-950 p-6 sm:p-8 overflow-hidden group`}
                >
                  <div className={`absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl transition-colors duration-500 ${acc.glow}`} />
                  <div className="relative">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${acc.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                      {f.icon}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">{f.title}</h3>
                    <p className="mt-2.5 text-sm text-neutral-400 max-w-md leading-relaxed">
                      {f.body}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= CAROUSEL ================= */}
      <section
        ref={carouselRef}
        className="relative border-t border-neutral-900 px-4 sm:px-6 py-16 sm:py-24 md:py-32"
        style={{ contentVisibility: "auto", containIntrinsicSize: "1200px" }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 sm:mb-16 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/60 px-3 py-1 mb-4">
              <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest">
                Features
              </span>
            </div>
            <div className="flex justify-center">
              <DiaTextReveal
                text="Everything you need"
                textColor="#ffffff"
                duration={1.5}
                className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-center leading-[1.05]"
              />
            </div>
            <p className="mt-4 text-sm sm:text-base text-neutral-400 max-w-xl mx-auto px-2">
              Built for the way people actually talk. No bloat, no noise.
            </p>
          </div>
          {showCarousel ? <Carousel slides={carouselSlides} /> : <div className="h-[380px] sm:h-[420px]" />}
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section
        ref={testimonialsRef}
        className="relative border-t border-neutral-900 px-4 sm:px-6 py-16 sm:py-24 md:py-32"
        style={{ contentVisibility: "auto", containIntrinsicSize: "1200px" }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 sm:mb-16 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/60 px-3 py-1 mb-4">
              <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest">
                Testimonials
              </span>
            </div>
            <div className="flex justify-center">
              <DiaTextReveal
                text="Loved by creators"
                textColor="#ffffff"
                duration={1.5}
                className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-center leading-[1.05]"
              />
            </div>
            <p className="mt-4 text-sm sm:text-base text-neutral-400 max-w-xl mx-auto px-2">
              Real feedback from people who use Postify every day.
            </p>
          </div>
          {showTestimonials ? (
            <AnimatedTestimonials testimonials={testimonials} />
          ) : (
            <div className="h-[380px] sm:h-[420px]" />
          )}
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section
        ref={ctaRef}
        className="relative border-t border-neutral-900 px-4 sm:px-6 py-20 sm:py-24 md:py-32 overflow-hidden"
        style={{ contentVisibility: "auto", containIntrinsicSize: "700px" }}
      >
        <div className="absolute inset-0 w-full h-full pointer-events-none opacity-60">
          {showSparkles && (
            <SparklesCore
              id="cta-sparkles"
              background="transparent"
              minSize={0.3}
              maxSize={1}
              particleDensity={narrow ? 30 : 60}
              className="w-full h-full"
              particleColor="#818cf8"
            />
          )}
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <DiaTextReveal
              text="Ready to join?"
              colors={["#6366f1", "#a855f7", "#ec4899", "#818cf8", "#6366f1"]}
              textColor="#ffffff"
              duration={1.8}
              className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-center leading-[1.05]"
            />
          </div>

          <p className="mt-4 text-sm sm:text-base text-neutral-400 max-w-lg mx-auto px-2">
            Create your account in seconds. No credit card, no setup — just start sharing.
          </p>

          <div className="mt-9 sm:mt-10 flex flex-col sm:flex-row flex-wrap justify-center gap-3">
            <a
              href="/register"
              className="inline-flex items-center justify-center w-full sm:w-auto min-h-[48px] rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-neutral-200 active:scale-[0.98]"
            >
              Get started free
            </a>
            <a
              href="/login"
              className="inline-flex items-center justify-center w-full sm:w-auto min-h-[48px] rounded-full border border-neutral-700 bg-neutral-900/50 px-7 py-3.5 text-sm font-semibold text-white transition hover:border-neutral-500 hover:bg-neutral-800 active:scale-[0.98]"
            >
              Sign in
            </a>
          </div>

          <p className="mt-5 text-[11px] text-neutral-500">
            Free forever · No credit card · Cancel anytime
          </p>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-neutral-900 px-4 sm:px-6 py-10 sm:py-12 pb-14 md:pb-12">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-sm font-semibold text-white">Postify</span>
          </div>
          <p className="text-xs text-neutral-600">&copy; 2026 Postify. All rights reserved.</p>
        </div>
      </footer>

      <div
        aria-hidden
        className="h-[env(safe-area-inset-bottom)] md:hidden"
      />

      <style jsx>{`
        @keyframes hero-in {
          from { opacity: 0.999; transform: translateY(8px); }
          to   { opacity: 1;     transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>
    </main>
  );
}