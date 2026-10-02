// app/login/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

/* ============================================================================
   Google Sign-In button — GIS renders a fixed-pixel-width iframe, so we
   measure the container and pass the real width to keep it full-bleed.
   ============================================================================ */
function GoogleSignInButton({
    onSuccess,
    onError,
    text = "continue_with",
}: {
    onSuccess: (credential: string) => void;
    onError: (message: string) => void;
    text?: "signin_with" | "signup_with" | "continue_with";
}) {
    const buttonRef = useRef<HTMLDivElement>(null);
    const initializedRef = useRef(false);

    useEffect(() => {
        if (initializedRef.current) return;

        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) {
            console.error("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local");
            onError("Google Sign-In is not configured.");
            return;
        }

        const existing = document.querySelector<HTMLScriptElement>(
            'script[src="https://accounts.google.com/gsi/client"]'
        );

        const initButton = () => {
            if (!window.google || !buttonRef.current) return;

            // GIS takes a pixel width (200–400). Measure the container so the
            // button fills the card instead of sitting at a fixed 320px.
            const wrapperWidth = buttonRef.current.offsetWidth || 320;
            const width = Math.max(200, Math.min(400, Math.floor(wrapperWidth)));

            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: (response) => onSuccess(response.credential),
            });

            window.google.accounts.id.renderButton(buttonRef.current, {
                theme: "filled_black",
                size: "large",
                shape: "pill",
                text,
                logo_alignment: "left",
                width,
            });

            initializedRef.current = true;
        };

        if (existing) {
            if (window.google) initButton();
            else existing.addEventListener("load", initButton);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = initButton;
        script.onerror = () => onError("Failed to load Google Sign-In.");
        document.body.appendChild(script);
    }, [onSuccess, onError, text]);

    return (
        <div
            ref={buttonRef}
            className="w-full [&>div]:!w-full [&>div>div]:!w-full [&_iframe]:!w-full"
            style={{ minHeight: 44 }}
        />
    );
}

/* ============================================================================
   Page
   ============================================================================ */
export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    /* ---------- Existing email/password flow — unchanged ---------- */
    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                window.location.href = "/dashboard";
            } else {
                alert(data.message || "Login failed");
            }
        } catch {
            alert("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    /* ---------- Google flow ---------- */
    async function handleGoogleSuccess(credential: string) {
        setGoogleLoading(true);
        try {
            const response = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential }),
            });

            const data = await response.json();

            if (response.ok) {
                window.location.href = "/dashboard";
            } else {
                alert(data.message || "Google login failed");
            }
        } catch {
            alert("Something went wrong. Please try again.");
        } finally {
            setGoogleLoading(false);
        }
    }

    return (
        <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
            {/* Static lamp glow */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-64 -z-0 overflow-hidden">
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[500px] max-w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[400px] max-w-full h-32 bg-gradient-to-b from-cyan-400/30 to-transparent blur-2xl" />
                <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[600px] max-w-full h-40 bg-cyan-500/20 blur-3xl rounded-full" />
            </div>

            {/* Ambient corner glow */}
            <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
                <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Heading */}
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 py-2 bg-clip-text text-center text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-transparent leading-tight">
                        Welcome back
                    </h1>
                    <p className="text-slate-400 text-xs sm:text-sm mt-2 sm:mt-3 px-4">
                        Sign in to continue to Socially
                    </p>
                </div>

                {/* Form card */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 md:p-8 shadow-2xl shadow-cyan-500/10">
                    <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
                        {/* Email */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2"
                            >
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none">
                                    <svg
                                        className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        />
                                    </svg>
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-100 placeholder-slate-500 text-sm sm:text-base transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:bg-slate-800"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-2">
                                <label
                                    htmlFor="password"
                                    className="block text-xs sm:text-sm font-medium text-slate-300"
                                >
                                    Password
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-[11px] sm:text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors whitespace-nowrap"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none">
                                    <svg
                                        className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        />
                                    </svg>
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-9 sm:pl-11 pr-10 sm:pr-11 py-2.5 sm:py-3 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-100 placeholder-slate-500 text-sm sm:text-base transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:bg-slate-800"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 sm:pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? (
                                        <svg
                                            className="w-4 h-4 sm:w-5 sm:h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            className="w-4 h-4 sm:w-5 sm:h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                            />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading || googleLoading}
                            className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm sm:text-base font-semibold shadow-lg shadow-cyan-500/30 hover:from-cyan-400 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation"
                        >
                            {isLoading ? (
                                <>
                                    <svg
                                        className="animate-spin w-4 h-4 sm:w-5 sm:h-5 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    <span className="text-sm sm:text-base">Signing in...</span>
                                </>
                            ) : (
                                "Sign in"
                            )}
                        </button>
                    </form>

                    {/* ================= DIVIDER ================= */}
                    <div className="relative my-5 sm:my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-slate-900/60 px-3 text-[10px] sm:text-[11px] font-medium uppercase tracking-widest text-slate-500">
                                or continue with
                            </span>
                        </div>
                    </div>

                    {/* ================= GOOGLE SIGN-IN ================= */}
                    <div className="relative">
                        <GoogleSignInButton
                            onSuccess={handleGoogleSuccess}
                            onError={(msg) => alert(msg)}
                            text="continue_with"
                        />

                        {googleLoading && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/80">
                                <svg
                                    className="animate-spin w-5 h-5 text-cyan-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sign up link */}
                <p className="text-center text-xs sm:text-sm text-slate-400 mt-5 sm:mt-6 px-4">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/register"
                        className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        Create one
                    </Link>
                </p>
            </div>
        </main>
    );
}