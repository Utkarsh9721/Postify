// app/messages/NewChatModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
    const router = useRouter();
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

    useEffect(() => {
        if (open) setQuery("");
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

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

    /**
     * Start an audio or video call with the given user.
     * Notifies the recipient via Pusher BEFORE navigating so the ring
     * modal actually appears on the other side.
     */
    async function startCall(userId: string, type: "audio" | "video") {
        onClose();

        try {
            const res = await fetch("/api/calls/initiate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipientId: userId,
                    callType: type,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                console.error("Call initiate failed:", data.message);
            }
        } catch (err) {
            console.error("Call initiate network error:", err);
        }

        router.push(`/call/${userId}?to=${userId}&type=${type}`);
    }

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
            onClick={onClose}
        >
            <div
                className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[85vh] sm:max-h-[70vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ─── HEADER ─── */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                        <h2 className="text-base font-bold text-gray-900">
                            New message
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 active:scale-90 transition-transform"
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
                    </button>
                </div>

                {/* ─── SEARCH ─── */}
                <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
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
                            className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-colors"
                        />
                        {query && (
                            <button
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
                            </button>
                        )}
                    </div>
                </div>

                {/* ─── LIST ─── */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-10 flex flex-col items-center justify-center gap-3">
                            <div className="w-6 h-6 rounded-full border-2 border-indigo-200 border-t-indigo-500 animate-spin" />
                            <p className="text-xs text-gray-400">Loading people...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-10 flex flex-col items-center justify-center text-center">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-3">
                                <svg
                                    className="w-7 h-7 text-indigo-400"
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
                                {query ? `No one matches "${query}"` : "No users yet"}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Try a different search term
                            </p>
                        </div>
                    ) : (
                        <ul className="py-2">
                            {filtered.map((u) => {
                                const initial = (u.name?.[0] ?? "U").toUpperCase();
                                const handle = "@" + (u.email?.split("@")[0] ?? "user");

                                return (
                                    <li
                                        key={u.id}
                                        className="px-2 group/row hover:bg-indigo-50/60 rounded-2xl transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            {/* Main row — click to open chat */}
                                            <button
                                                onClick={() => onPick(u.id)}
                                                className="flex-1 flex items-center gap-3 px-2 py-2.5 rounded-2xl active:scale-[0.98] transition-colors text-left group"
                                            >
                                                <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 flex-shrink-0 shadow-sm">
                                                    <div className="w-full h-full rounded-full overflow-hidden bg-white">
                                                        {u.avatar ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={u.avatar}
                                                                alt={u.name}
                                                                className="w-full h-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                                                <span className="text-sm font-bold text-white">
                                                                    {initial}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                                                            {u.name}
                                                        </p>
                                                        {u.isFollowing && u.followsMe && (
                                                            <span className="text-[9px] font-bold text-green-600 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                                                FRIENDS
                                                            </span>
                                                        )}
                                                        {u.followsMe && !u.isFollowing && (
                                                            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                                                FOLLOWS YOU
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 truncate mt-0.5">
                                                        {handle}
                                                    </p>
                                                </div>
                                            </button>

                                            {/* Action buttons — audio + video call */}
                                            <div className="flex items-center gap-0.5 pr-2 flex-shrink-0">
                                                <button
                                                    onClick={() => startCall(u.id, "audio")}
                                                    className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-100 active:scale-90 transition-all"
                                                    aria-label={`Audio call ${u.name}`}
                                                    title="Audio call"
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
                                                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                                        />
                                                    </svg>
                                                </button>

                                                <button
                                                    onClick={() => startCall(u.id, "video")}
                                                    className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-100 active:scale-90 transition-all"
                                                    aria-label={`Video call ${u.name}`}
                                                    title="Video call"
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
                                                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}