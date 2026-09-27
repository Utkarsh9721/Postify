// app/messages/NewChatModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

type Person = {
    id: string;
    name: string;
    email: string;
    avatar: string;
    bio: string;
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
    followsMe: boolean;
};

export default function NewChatModal({
    open,
    onClose,
    onPick,
}: {
    open: boolean;
    onClose: () => void;
    onPick: (userId: string) => void;
}) {
    const [users, setUsers] = useState<Person[]>([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState("");

    useEffect(() => {
        if (!open) return;

        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const res = await fetch("/api/users?limit=100");
                const data = await res.json();
                if (!cancelled && res.ok) {
                    setUsers(data.users || []);
                }
            } catch {
                // ignore
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();

        return () => {
            cancelled = true;
        };
    }, [open]);

    // Reset search when opening
    useEffect(() => {
        if (open) setQuery("");
    }, [open]);

    const filtered = useMemo(() => {
        let list = users;
        if (query.trim()) {
            const q = query.trim().toLowerCase();
            list = list.filter(
                (u) =>
                    u.name.toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q)
            );
        }
        return [...list].sort((a, b) => {
            const score = (u: Person) =>
                u.isFollowing && u.followsMe ? 2 : u.isFollowing ? 1 : 0;
            return score(b) - score(a);
        });
    }, [users, query]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 320,
                            damping: 32,
                        }}
                        className="relative bg-white/90 backdrop-blur-2xl w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-[0_24px_80px_-16px_rgba(99,102,241,0.35)] border border-white/60 max-h-[85vh] sm:max-h-[70vh] flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Ambient glow */}
                        <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br from-indigo-200/50 to-purple-200/50 blur-3xl" />

                        {/* ─── HEADER ─── */}
                        <div className="relative px-5 py-4 border-b border-white/60 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-2.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse" />
                                <h2 className="text-base font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                    New message
                                </h2>
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="p-1.5 rounded-full hover:bg-white/60 text-gray-500 transition-colors"
                                aria-label="Close"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </motion.button>
                        </div>

                        {/* ─── SEARCH ─── */}
                        <div className="relative px-4 py-3 border-b border-white/60 flex-shrink-0">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                                    <svg
                                        className="w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                </div>
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search people..."
                                    autoFocus
                                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-white/60 bg-white/60 backdrop-blur-sm text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 focus:bg-white shadow-sm hover:shadow-md transition-all duration-300"
                                />
                                <AnimatePresence>
                                    {query && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            onClick={() => setQuery("")}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                            aria-label="Clear"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* ─── LIST ─── */}
                        <div className="relative flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="p-10 flex flex-col items-center justify-center gap-3">
                                    <div className="w-6 h-6 rounded-full border-2 border-indigo-200 border-t-indigo-500 animate-spin" />
                                    <p className="text-xs text-gray-400">
                                        Loading people...
                                    </p>
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="p-10 flex flex-col items-center justify-center text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 ring-1 ring-white/80 shadow-inner flex items-center justify-center mb-3">
                                        <svg
                                            className="w-7 h-7 text-indigo-400 animate-pulse"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">
                                        {query
                                            ? `No one matches "${query}"`
                                            : "No users yet"}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Try a different search term
                                    </p>
                                </div>
                            ) : (
                                <ul className="py-2">
                                    <AnimatePresence initial={false}>
                                        {filtered.map((u, idx) => {
                                            const initial = (
                                                u.name?.[0] ?? "U"
                                            ).toUpperCase();
                                            const handle =
                                                "@" +
                                                (u.email?.split("@")[0] ??
                                                    "user");

                                            return (
                                                <motion.li
                                                    key={u.id}
                                                    initial={{
                                                        opacity: 0,
                                                        y: 8,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        y: 0,
                                                    }}
                                                    transition={{
                                                        duration: 0.2,
                                                        delay: Math.min(
                                                            idx * 0.015,
                                                            0.15
                                                        ),
                                                    }}
                                                    className="px-2"
                                                >
                                                    <button
                                                        onClick={() =>
                                                            onPick(u.id)
                                                        }
                                                        className="w-full flex items-center gap-3 px-2 py-2.5 rounded-2xl hover:bg-gradient-to-r hover:from-indigo-50/70 hover:to-purple-50/70 active:scale-[0.98] transition-all duration-200 text-left group"
                                                    >
                                                        {/* Avatar with gradient ring */}
                                                        <div className="relative w-11 h-11 rounded-full p-[2px] bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 flex-shrink-0 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
                                                            <div className="w-full h-full rounded-full overflow-hidden bg-white">
                                                                {u.avatar ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img
                                                                        src={
                                                                            u.avatar
                                                                        }
                                                                        alt={
                                                                            u.name
                                                                        }
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                                                        <span className="text-sm font-bold text-white">
                                                                            {
                                                                                initial
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                                                                    {u.name}
                                                                </p>
                                                                {u.isFollowing &&
                                                                    u.followsMe && (
                                                                        <span className="text-[9px] font-bold text-green-600 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                                                            FRIENDS
                                                                        </span>
                                                                    )}
                                                                {u.followsMe &&
                                                                    !u.isFollowing && (
                                                                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                                                            FOLLOWS
                                                                            YOU
                                                                        </span>
                                                                    )}
                                                            </div>
                                                            <p className="text-xs text-gray-500 truncate mt-0.5">
                                                                {handle}
                                                            </p>
                                                        </div>

                                                        {/* Chevron */}
                                                        <svg
                                                            className="w-5 h-5 text-gray-300 flex-shrink-0 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all duration-200"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M9 5l7 7-7 7"
                                                            />
                                                        </svg>
                                                    </button>
                                                </motion.li>
                                            );
                                        })}
                                    </AnimatePresence>
                                </ul>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}