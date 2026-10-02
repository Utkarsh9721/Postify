// app/dashboard/LogoutButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleLogout() {
        if (loading) return;
        setLoading(true);
        try {
            const response = await fetch("/api/auth/logout", { method: "POST" });
            if (response.ok) {
                router.push("/login");
                router.refresh();
            } else {
                setLoading(false);
            }
        } catch {
            setLoading(false);
            alert("Logout failed. Try again.");
        }
    }

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            aria-label="Logout"
            className="group flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
            {loading ? (
                <svg
                    className="w-4 h-4 animate-spin"
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
            ) : (
                <svg
                    className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                </svg>
            )}
            <span className="hidden md:inline">
                {loading ? "Logging out…" : "Logout"}
            </span>
        </button>
    );
}