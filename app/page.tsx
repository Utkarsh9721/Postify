// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import ErrorBoundary from "./ErrorBoundary";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";
import Carousel from "@/components/ui/carousel";
import { SparklesCore } from "@/components/ui/sparkles";
import { Spotlight } from "@/components/ui/spotlight";
import { DiaTextReveal } from "@/components/ui/dia-text-reveal";

const Globe3D = dynamic(
  () => import("@/components/ui/3d-globe").then((mod) => mod.Globe3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="h-48 w-48 animate-pulse rounded-full bg-indigo-500/20" />
      </div>
    ),
  }
);

const globeMarkers = [
  {
    lat: 40.7128,
    lng: -74.006,
    src: "https://ui-avatars.com/api/?name=NY&background=6366f1&color=fff",
    label: "New York",
  },
  {
    lat: 51.5074,
    lng: -0.1278,
    src: "https://ui-avatars.com/api/?name=LDN&background=a855f7&color=fff",
    label: "London",
  },
  {
    lat: 35.6762,
    lng: 139.6503,
    src: "https://ui-avatars.com/api/?name=TYO&background=ec4899&color=fff",
    label: "Tokyo",
  },
  {
    lat: -33.8688,
    lng: 151.2093,
    src: "https://ui-avatars.com/api/?name=SYD&background=14b8a6&color=fff",
    label: "Sydney",
  },
  {
    lat: 28.6139,
    lng: 77.209,
    src: "https://ui-avatars.com/api/?name=DEL&background=ef4444&color=fff",
    label: "New Delhi",
  },
];

const carouselSlides = [
  {
    title: "Real-time Chat",
    button: "Try it",
    src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80",
  },
  {
    title: "Share Moments",
    button: "Explore",
    src: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=80",
  },
  {
    title: "Discover People",
    button: "Browse",
    src: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=80",
  },
];

const testimonials = [
  {
    quote: "Postify completely changed how I share my work. Simple, fast, and beautifully designed.",
    name: "Sarah Johnson",
    designation: "Product Designer",
    src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
  },
  {
    quote: "Finally a social app that doesn't feel bloated. Real-time chat is flawless.",
    name: "Michael Chen",
    designation: "Software Engineer",
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  },
  {
    quote: "The cleanest interface I've used. My engagement has never been higher.",
    name: "Emma Wilson",
    designation: "Content Creator",
    src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
  },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white selection:bg-indigo-500/30 overflow-x-hidden">
      {/* ================= HERO + GLOBE ================= */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <Spotlight
          className="-top-40 left-0 md:-top-20 md:left-60 pointer-events-none"
          fill="#6366f1"
        />

        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-neutral-950 to-black" />

        <div className="absolute inset-0 w-full h-full pointer-events-none hidden sm:block">
          <SparklesCore
            id="hero-sparkles"
            background="transparent"
            minSize={0.4}
            maxSize={1}
            particleDensity={80}
            className="w-full h-full"
            particleColor="#a5b4fc"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 pb-16 sm:py-16 lg:py-0 grid grid-cols-1 lg:grid-cols-2 gap-20 sm:gap-16 lg:gap-8 items-center">
          {/* LEFT: copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center lg:text-left order-2 lg:order-1"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/60 px-3 py-1.5 mb-4 sm:mb-6 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[10px] sm:text-xs font-medium text-neutral-400">
                Now in public beta
              </span>
            </div>

            {/* FIX: flex wrapper so justify-center actually applies on mobile */}
            <div className="flex justify-center lg:justify-start">
              <DiaTextReveal
                text="Postify"
                colors={[
                  "#6366f1",
                  "#a855f7",
                  "#ec4899",
                  "#818cf8",
                  "#6366f1",
                ]}
                textColor="#ffffff"
                duration={2}
                className="text-3xl xs:text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] text-center lg:text-left"
              />
            </div>

            <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-xl text-neutral-400 max-w-xl mx-auto lg:mx-0 leading-relaxed px-2 sm:px-0">
              Where conversations happen. Share moments with
              friends, discover people who matter, and stay
              connected across the globe — all in one clean,
              fast, distraction-free space.
            </p>

            <div className="mt-6 sm:mt-8 grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto lg:mx-0">
              <div>
                <p className="text-lg sm:text-2xl font-bold text-white">
                  40+
                </p>
                <p className="text-[9px] sm:text-xs text-neutral-500 mt-0.5">
                  Countries
                </p>
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-white">
                  Real-time
                </p>
                <p className="text-[9px] sm:text-xs text-neutral-500 mt-0.5">
                  Messaging
                </p>
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-white">
                  Private
                </p>
                <p className="text-[9px] sm:text-xs text-neutral-500 mt-0.5">
                  No ads
                </p>
              </div>
            </div>

            <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start gap-3">
              <a
                href="/login"
                className="w-full sm:w-auto rounded-full bg-white px-6 sm:px-8 py-3.5 text-sm font-semibold text-black transition hover:scale-105 hover:bg-neutral-200 text-center"
              >
                Login
              </a>
              <a
                href="/register"
                className="w-full sm:w-auto rounded-full border border-neutral-700 bg-neutral-900/50 px-6 sm:px-8 py-3.5 text-sm font-semibold text-white transition hover:scale-105 hover:border-neutral-500 hover:bg-neutral-800 text-center"
              >
                Create Account
              </a>
            </div>
          </motion.div>

          {/* RIGHT: globe */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              ease: "easeOut",
            }}
            className="relative h-[340px] xs:h-[380px] sm:h-[450px] md:h-[500px] lg:h-[600px] w-full order-1 lg:order-2 touch-none mb-16 sm:mb-0"
          >
            {mounted ? (
              <ErrorBoundary
                fallback={
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-neutral-600">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                      <svg
                        className="w-12 h-12 text-indigo-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                        />
                        <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                      </svg>
                    </div>
                    <p className="text-xs">
                      Globe loading...
                    </p>
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
                <div className="h-40 w-40 sm:h-48 sm:w-48 animate-pulse rounded-full bg-indigo-500/20" />
              </div>
            )}

            <p className="absolute -bottom-10 sm:-bottom-2 left-0 right-0 text-center text-[10px] sm:text-xs text-neutral-600">
              Live connections across{" "}
              <span className="text-indigo-400">
                5 continents
              </span>
            </p>
          </motion.div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 text-neutral-600">
          <span className="text-[10px] uppercase tracking-widest">
            Scroll
          </span>
          <div className="w-px h-8 bg-gradient-to-b from-neutral-600 to-transparent" />
        </div>
      </section>

      {/* ================= BENTO GRID ================= */}
      <section className="relative border-t border-neutral-900 px-4 sm:px-6 py-16 sm:py-24 md:py-32">
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
                className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-center"
              />
            </div>

            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-neutral-400 max-w-xl mx-auto px-2">
              Every feature exists for a reason. No filler, no
              distractions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="md:col-span-2 relative rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900/60 to-neutral-950 p-5 sm:p-8 overflow-hidden group active:scale-[0.99] transition-transform"
            >
              <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-indigo-500/10 blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-500" />
              <div className="relative">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-3 sm:mb-4">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-base sm:text-xl font-bold text-white">
                  Instant messaging
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-neutral-400 max-w-md leading-relaxed">
                  Messages arrive the moment you hit send.
                  No refreshing, no waiting, no loading
                  spinners. Powered by live connections.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900/60 to-neutral-950 p-5 sm:p-8 overflow-hidden group active:scale-[0.99] transition-transform"
            >
              <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-pink-500/10 blur-3xl group-hover:bg-pink-500/20 transition-colors duration-500" />
              <div className="relative">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mb-3 sm:mb-4">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Zero ads
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  Your feed, your rules. No promoted posts,
                  no tracking pixels.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="relative rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900/60 to-neutral-950 p-5 sm:p-8 overflow-hidden group active:scale-[0.99] transition-transform"
            >
              <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl group-hover:bg-emerald-500/20 transition-colors duration-500" />
              <div className="relative">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-3 sm:mb-4">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  End-to-end
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  Private by default. Your data stays yours.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="md:col-span-2 relative rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900/60 to-neutral-950 p-5 sm:p-8 overflow-hidden group active:scale-[0.99] transition-transform"
            >
              <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-cyan-500/10 blur-3xl group-hover:bg-cyan-500/20 transition-colors duration-500" />
              <div className="relative">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-3 sm:mb-4">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
                    />
                  </svg>
                </div>
                <h3 className="text-base sm:text-xl font-bold text-white">
                  Global reach
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-neutral-400 max-w-md leading-relaxed">
                  Connect with anyone, anywhere. Postify
                  works in over 40 countries with zero
                  latency across regions.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= CAROUSEL ================= */}
      <section className="relative border-t border-neutral-900 px-4 sm:px-6 py-16 sm:py-24 md:py-32">
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
                className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-center"
              />
            </div>

            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-neutral-400 max-w-xl mx-auto px-2">
              Built for the way people actually talk. No bloat,
              no noise.
            </p>
          </div>
          <Carousel slides={carouselSlides} />
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="relative border-t border-neutral-900 px-4 sm:px-6 py-16 sm:py-24 md:py-32">
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
                className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-center"
              />
            </div>

            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-neutral-400 max-w-xl mx-auto px-2">
              Real feedback from people who use Postify every
              day.
            </p>
          </div>
          <AnimatedTestimonials testimonials={testimonials} />
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="relative border-t border-neutral-900 px-4 sm:px-6 py-16 sm:py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 w-full h-full pointer-events-none opacity-50 hidden sm:block">
          <SparklesCore
            id="cta-sparkles"
            background="transparent"
            minSize={0.3}
            maxSize={1}
            particleDensity={60}
            className="w-full h-full"
            particleColor="#818cf8"
          />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <DiaTextReveal
              text="Ready to join?"
              colors={[
                "#6366f1",
                "#a855f7",
                "#ec4899",
                "#818cf8",
                "#6366f1",
              ]}
              textColor="#ffffff"
              duration={1.8}
              className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-center"
            />
          </div>

          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-neutral-400 max-w-lg mx-auto px-2">
            Create your account in seconds. No credit card, no
            setup — just start sharing.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap justify-center gap-3">
            <a
              href="/register"
              className="w-full sm:w-auto rounded-full bg-white px-6 sm:px-8 py-3.5 text-sm font-semibold text-black transition hover:scale-105 hover:bg-neutral-200 text-center"
            >
              Get started free
            </a>
            <a
              href="/login"
              className="w-full sm:w-auto rounded-full border border-neutral-700 bg-neutral-900/50 px-6 sm:px-8 py-3.5 text-sm font-semibold text-white transition hover:scale-105 hover:border-neutral-500 hover:bg-neutral-800 text-center"
            >
              Sign in
            </a>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-neutral-900 px-4 sm:px-6 py-10 sm:py-12">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                P
              </span>
            </div>
            <span className="text-sm font-semibold text-white">
              Postify
            </span>
          </div>
          <p className="text-xs text-neutral-600">
            &copy; 2026 Postify. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}