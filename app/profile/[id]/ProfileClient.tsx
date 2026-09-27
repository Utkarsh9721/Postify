// app/profile/[id]/ProfileClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";

type Profile = {
    id: string;
    name: string;
    email: string;
    avatar: string;
    bio: string;
    followersCount: number;
    followingCount: number;
    postsCount: number;
    joinedAt: string;
    isMe: boolean;
    isFollowing: boolean;
    followsMe: boolean;
};

type PostLite = {
    id: string;
    content: string;
    createdAt: string;
    likesCount: number;
    commentsCount: number;
};

export default function ProfileClient({
    profile,
    posts,
}: {
    profile: Profile;
    posts: PostLite[];
}) {
    const router = useRouter();
    const [isFollowing, setIsFollowing] = useState(profile.isFollowing);
    const [followersCount, setFollowersCount] = useState(profile.followersCount);
    const [busy, setBusy] = useState(false);
    const [messaging, setMessaging] = useState(false);

    const initial = (profile.name?.[0] ?? "U").toUpperCase();
    const handle = "@" + (profile.email?.split("@")[0] ?? "user");

    async function toggleFollow() {
        if (busy || profile.isMe) return;
        setBusy(true);

        const next = !isFollowing;
        setIsFollowing(next);
        setFollowersCount((n) => n + (next ? 1 : -1));

        try {
            const res = await fetch(`/api/users/${profile.id}/follow`, {
                method: "POST",
            });
            const data = await res.json();

            if (!res.ok) {
                setIsFollowing(!next);
                setFollowersCount((n) => n + (next ? -1 : 1));
                return;
            }

            setIsFollowing(data.following);
            setFollowersCount(data.followersCount);
            router.refresh();
        } catch {
            setIsFollowing(!next);
            setFollowersCount((n) => n + (next ? -1 : 1));
        } finally {
            setBusy(false);
        }
    }

    async function messageUser() {
        setMessaging(true);
        try {
            const res = await fetch("/api/chats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: profile.id }),
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.message || "Could not open chat");
                return;
            }
            router.push(`/messages?chat=${data.chat.id}`);
        } catch {
            alert("Network error");
        } finally {
            setMessaging(false);
        }
    }

    const relationship =
        profile.isFollowing && profile.followsMe
            ? "Friends"
            : profile.isFollowing
                ? "Following"
                : profile.followsMe
                    ? "Follows you"
                    : null;

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
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14 sm:h-16">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 group"
                        >
                            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-300/50 group-hover:scale-105 transition-all duration-300">
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
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                            </div>
                            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent hidden sm:block">
                                Socially
                            </span>
                        </Link>
                        <button
                            onClick={() => router.back()}
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
                        </button>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Profile card */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_-12px_rgba(99,102,241,0.15)] hover:shadow-[0_16px_48px_-16px_rgba(99,102,241,0.25)] transition-all duration-500 overflow-hidden"
                >
                    {/* Subtle top accent line */}
                    <div className="h-1 bg-gradient-to-r from-indigo-500/40 via-purple-500/60 to-pink-500/40" />

                    <div className="px-5 sm:px-8 pb-6 sm:pb-8 pt-6 sm:pt-8">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                                {/* Avatar with gradient ring */}
                                <div className="relative group/avatar flex-shrink-0">
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-[3px] bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 shadow-lg group-hover/avatar:shadow-xl group-hover/avatar:shadow-indigo-300/50 group-hover/avatar:scale-105 transition-all duration-300">
                                        <div className="w-full h-full rounded-full overflow-hidden bg-white">
                                            {profile.avatar ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={profile.avatar}
                                                    alt={profile.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                                    <span className="text-3xl sm:text-4xl font-bold text-white">
                                                        {initial}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Pulsing online dot */}
                                    <span className="absolute bottom-1.5 right-1.5 flex h-4 w-4">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white" />
                                    </span>
                                </div>

                                <div className="sm:pb-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                            {profile.name}
                                        </h1>
                                        {relationship && (
                                            <span
                                                className={`text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full border ${relationship === "Friends"
                                                        ? "text-green-600 bg-green-50 border-green-100"
                                                        : relationship ===
                                                            "Follows you"
                                                            ? "text-indigo-600 bg-indigo-50 border-indigo-100"
                                                            : "text-gray-600 bg-gray-100 border-gray-200"
                                                    }`}
                                            >
                                                {relationship}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {handle}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 sm:mt-2">
                                {!profile.isMe && (
                                    <>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={toggleFollow}
                                            disabled={busy}
                                            className={`relative overflow-hidden px-5 py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-60 shadow-md ${isFollowing
                                                    ? "bg-white/70 backdrop-blur-sm text-gray-700 hover:bg-white border border-white/60 hover:border-gray-200"
                                                    : "text-white shadow-indigo-300/40 hover:shadow-lg hover:shadow-indigo-400/50"
                                                }`}
                                        >
                                            {!isFollowing && (
                                                <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-[length:200%_100%]" />
                                            )}
                                            <span className="relative">
                                                {busy
                                                    ? "..."
                                                    : isFollowing
                                                        ? "Following"
                                                        : profile.followsMe
                                                            ? "Follow back"
                                                            : "Follow"}
                                            </span>
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={messageUser}
                                            disabled={messaging}
                                            className="px-5 py-2.5 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 text-gray-700 hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all disabled:opacity-60 flex items-center gap-2 text-sm font-semibold shadow-sm"
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
                                            {messaging ? "..." : "Message"}
                                        </motion.button>
                                    </>
                                )}
                                {profile.isMe && (
                                    <Link
                                        href="/profile/edit"
                                        className="relative overflow-hidden px-5 py-2.5 rounded-full text-white text-sm font-semibold shadow-lg shadow-indigo-300/40 hover:shadow-xl hover:shadow-indigo-400/50 active:scale-95 transition-all group"
                                    >
                                        <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-[length:200%_100%]" />
                                        <span className="relative">
                                            Edit profile
                                        </span>
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Bio */}
                        <p className="text-sm sm:text-base text-gray-700 mt-6 leading-relaxed">
                            {profile.bio || (
                                <span className="italic text-gray-400">
                                    No bio yet
                                </span>
                            )}
                        </p>

                        {/* Joined date */}
                        {profile.joinedAt && (
                            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                                <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                Joined{" "}
                                {new Date(profile.joinedAt).toLocaleDateString(
                                    undefined,
                                    { month: "long", year: "numeric" }
                                )}
                            </p>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-6 sm:gap-8 mt-5 pt-5 border-t border-white/60">
                            <div className="text-center py-1.5 px-3 rounded-xl hover:bg-white/60 transition-colors">
                                <p className="text-lg sm:text-xl font-bold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    {profile.postsCount}
                                </p>
                                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 font-medium">
                                    Posts
                                </p>
                            </div>
                            <Link
                                href={`/profile/${profile.id}/followers`}
                                className="text-center py-1.5 px-3 rounded-xl hover:bg-white/60 transition-colors group/stat"
                            >
                                <p className="text-lg sm:text-xl font-bold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover/stat:scale-105 transition-transform">
                                    {followersCount}
                                </p>
                                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 font-medium">
                                    Followers
                                </p>
                            </Link>
                            <Link
                                href={`/profile/${profile.id}/following`}
                                className="text-center py-1.5 px-3 rounded-xl hover:bg-white/60 transition-colors group/stat"
                            >
                                <p className="text-lg sm:text-xl font-bold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover/stat:scale-105 transition-transform">
                                    {profile.followingCount}
                                </p>
                                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 font-medium">
                                    Following
                                </p>
                            </Link>
                        </div>
                    </div>
                </motion.div>

                {/* Posts */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.5,
                        delay: 0.1,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    className="mt-6"
                >
                    <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse" />
                        Posts
                    </h2>

                    {posts.length === 0 ? (
                        <div className="relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_-12px_rgba(99,102,241,0.15)] p-10 text-center overflow-hidden">
                            <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br from-indigo-200/40 to-purple-200/40 blur-3xl" />
                            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 ring-1 ring-white/80 shadow-inner flex items-center justify-center mx-auto mb-3">
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
                                        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                                    />
                                </svg>
                            </div>
                            <p className="relative text-sm font-semibold text-gray-700">
                                No posts yet
                            </p>
                            <p className="relative text-xs text-gray-400 mt-1">
                                When {profile.name} posts, you&apos;ll see it
                                here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <AnimatePresence initial={false}>
                                {posts.map((p, idx) => (
                                    <motion.article
                                        key={p.id}
                                        layout
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.3,
                                            delay: Math.min(idx * 0.03, 0.3),
                                            ease: "easeOut",
                                        }}
                                        className="group relative rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_24px_-12px_rgba(99,102,241,0.15)] hover:shadow-[0_12px_32px_-16px_rgba(99,102,241,0.25)] hover:border-white/80 transition-all duration-300 p-4 sm:p-5 overflow-hidden"
                                    >
                                        <div className="pointer-events-none absolute -top-16 -right-16 w-32 h-32 rounded-full bg-gradient-to-br from-indigo-200/40 to-purple-200/40 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        <p className="relative text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                            {p.content}
                                        </p>

                                        <div className="relative flex items-center gap-6 mt-3 pt-3 border-t border-white/60 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <svg
                                                    className="w-3.5 h-3.5 text-pink-500"
                                                    fill="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                </svg>
                                                {p.likesCount}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <svg
                                                    className="w-3.5 h-3.5 text-indigo-500"
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
                                                {p.commentsCount}
                                            </span>
                                            <span className="ml-auto text-gray-400">
                                                {timeAgo(p.createdAt)}
                                            </span>
                                        </div>
                                    </motion.article>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}

function timeAgo(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
}