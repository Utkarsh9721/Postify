// app/profile/[id]/followers/FollowListClient.tsx
// (copy the same file to app/profile/[id]/following/FollowListClient.tsx)
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    isMe: boolean;
};

export default function FollowListClient({
    title,
    backHref,
    initialUsers,
}: {
    title: string;
    backHref: string;
    initialUsers: Person[];
}) {
    const router = useRouter();
    const [users, setUsers] = useState<Person[]>(initialUsers);
    const [busyId, setBusyId] = useState<string | null>(null);

    async function toggleFollow(userId: string) {
        setBusyId(userId);
        setUsers((prev) =>
            prev.map((u) =>
                u.id === userId
                    ? {
                        ...u,
                        isFollowing: !u.isFollowing,
                        followersCount:
                            u.followersCount + (u.isFollowing ? -1 : 1),
                    }
                    : u
            )
        );

        try {
            const res = await fetch(`/api/users/${userId}/follow`, {
                method: "POST",
            });
            const data = await res.json();
            if (!res.ok) throw new Error();

            setUsers((prev) =>
                prev.map((u) =>
                    u.id === userId
                        ? {
                            ...u,
                            isFollowing: data.following,
                            followersCount: data.followersCount,
                        }
                        : u
                )
            );
        } catch {
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === userId
                        ? {
                            ...u,
                            isFollowing: !u.isFollowing,
                            followersCount:
                                u.followersCount +
                                (u.isFollowing ? -1 : 1),
                        }
                        : u
                )
            );
        } finally {
            setBusyId(null);
        }
    }

    async function messageUser(userId: string) {
        try {
            const res = await fetch("/api/chats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.message || "Could not open chat");
                return;
            }
            router.push(`/messages?chat=${data.chat.id}`);
        } catch {
            alert("Network error");
        }
    }

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40 pb-28 lg:pb-0">
            {/* Ambient background orbs */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
                <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-200/40 blur-[120px]" />
                <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-purple-200/30 blur-[140px]" />
                <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-pink-200/20 blur-[120px]" />
            </div>

            {/* Navbar */}
            <nav className="sticky top-0 z-40 border-b border-white/40 bg-white/60 backdrop-blur-2xl">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14 sm:h-16">
                        <Link
                            href={backHref}
                            className="text-xs sm:text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors flex items-center gap-1 group"
                        >
                            <svg
                                className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            Back
                        </Link>
                        <h1 className="text-sm sm:text-base font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            {title}
                        </h1>
                        <span className="text-xs sm:text-sm font-medium text-gray-500 bg-white/60 backdrop-blur-sm border border-white/60 px-2.5 py-0.5 rounded-full">
                            {users.length}
                        </span>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {users.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_-12px_rgba(99,102,241,0.15)] p-12 text-center overflow-hidden"
                    >
                        <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br from-indigo-200/40 to-purple-200/40 blur-3xl" />

                        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 ring-1 ring-white/80 shadow-inner flex items-center justify-center mx-auto mb-4">
                            <svg
                                className="w-8 h-8 text-indigo-400 animate-pulse"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                        </div>
                        <p className="relative text-sm font-semibold text-gray-700">
                            No {title.toLowerCase()} yet
                        </p>
                        <p className="relative text-xs text-gray-400 mt-1">
                            When someone {title.toLowerCase() === "followers"
                                ? "follows this account"
                                : "is followed"}, they&apos;ll appear here.
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence initial={false}>
                            {users.map((u, idx) => {
                                const initial = (
                                    u.name?.[0] ?? "U"
                                ).toUpperCase();
                                const handle =
                                    "@" + (u.email?.split("@")[0] ?? "user");

                                return (
                                    <motion.div
                                        key={u.id}
                                        layout
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{
                                            duration: 0.25,
                                            delay: Math.min(idx * 0.02, 0.2),
                                            ease: "easeOut",
                                        }}
                                        className="group relative rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_24px_-12px_rgba(99,102,241,0.15)] hover:shadow-[0_12px_32px_-16px_rgba(99,102,241,0.25)] hover:border-white/80 transition-all duration-300 p-4 overflow-hidden"
                                    >
                                        {/* Corner glow on hover */}
                                        <div className="pointer-events-none absolute -top-16 -right-16 w-32 h-32 rounded-full bg-gradient-to-br from-indigo-200/40 to-purple-200/40 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        <div className="relative flex items-center gap-3">
                                            {/* Avatar with gradient ring */}
                                            <Link
                                                href={`/profile/${u.id}`}
                                                className="relative flex-shrink-0"
                                            >
                                                <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
                                                    <div className="w-full h-full rounded-full overflow-hidden bg-white">
                                                        {u.avatar ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={u.avatar}
                                                                alt={u.name}
                                                                className="w-full h-full object-cover"
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
                                                {/* Me indicator */}
                                                {u.isMe && (
                                                    <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-bold text-white bg-gradient-to-br from-indigo-500 to-purple-600 px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
                                                        YOU
                                                    </span>
                                                )}
                                            </Link>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Link
                                                        href={`/profile/${u.id}`}
                                                    >
                                                        <p className="text-sm font-semibold text-gray-900 truncate hover:text-indigo-600 transition-colors">
                                                            {u.name}
                                                        </p>
                                                    </Link>
                                                    {u.isFollowing &&
                                                        u.followsMe &&
                                                        !u.isMe && (
                                                            <span className="text-[9px] font-bold text-green-600 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                                                FRIENDS
                                                            </span>
                                                        )}
                                                    {u.followsMe &&
                                                        !u.isFollowing &&
                                                        !u.isMe && (
                                                            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                                                FOLLOWS YOU
                                                            </span>
                                                        )}
                                                </div>
                                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                                    {handle}
                                                </p>
                                                <p className="text-[11px] sm:text-xs text-gray-400 mt-1">
                                                    <span className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                                        {u.followersCount}
                                                    </span>{" "}
                                                    followers
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            {!u.isMe && (
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <motion.button
                                                        whileTap={{
                                                            scale: 0.92,
                                                        }}
                                                        onClick={() =>
                                                            toggleFollow(u.id)
                                                        }
                                                        disabled={
                                                            busyId === u.id
                                                        }
                                                        className={`relative overflow-hidden px-4 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-60 shadow-sm ${u.isFollowing
                                                                ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                                                                : "text-white shadow-indigo-200/60 hover:shadow-md hover:shadow-indigo-300/60"
                                                            }`}
                                                    >
                                                        {!u.isFollowing && (
                                                            <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600" />
                                                        )}
                                                        <span className="relative">
                                                            {busyId === u.id
                                                                ? "..."
                                                                : u.isFollowing
                                                                    ? "Following"
                                                                    : u.followsMe
                                                                        ? "Follow back"
                                                                        : "Follow"}
                                                        </span>
                                                    </motion.button>

                                                    <motion.button
                                                        whileTap={{
                                                            scale: 0.9,
                                                        }}
                                                        onClick={() =>
                                                            messageUser(u.id)
                                                        }
                                                        className="p-2 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 transition-all"
                                                        aria-label="Message"
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
                                                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                                            />
                                                        </svg>
                                                    </motion.button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
}