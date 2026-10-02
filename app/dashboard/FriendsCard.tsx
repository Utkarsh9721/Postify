// app/dashboard/FriendsCard.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";

export type Person = {
    id: string;
    name: string;
    email: string;
    avatar: string;
    bio: string;
    followersCount: number;
    isFollowing: boolean;
};

export default function FriendsCard({ users }: { users: Person[] }) {
    const router = useRouter();
    const [list, setList] = useState(users);
    const [busyId, setBusyId] = useState<string | null>(null);

    async function toggleFollow(userId: string) {
        setBusyId(userId);

        setList((prev) =>
            prev.map((u) =>
                u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u
            )
        );

        try {
            const res = await fetch(`/api/users/${userId}/follow`, {
                method: "POST",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setList((prev) =>
                prev.map((u) =>
                    u.id === userId
                        ? { ...u, isFollowing: data.following }
                        : u
                )
            );
        } catch {
            setList((prev) =>
                prev.map((u) =>
                    u.id === userId
                        ? { ...u, isFollowing: !u.isFollowing }
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
        <div className="relative rounded-3xl bg-white/85 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-4 sm:p-5 overflow-hidden">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                    Friends
                </h3>
                <Link
                    href="/friends"
                    className="text-[11px] sm:text-xs font-semibold text-indigo-600 hover:text-purple-600 transition-colors flex items-center gap-1 group"
                >
                    See all
                    <svg
                        className="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
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
                </Link>
            </div>

            {list.length === 0 ? (
                <div className="py-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-2">
                        <svg
                            className="w-6 h-6 text-indigo-400"
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
                    <p className="text-xs text-gray-400">No suggestions yet</p>
                </div>
            ) : (
                <div className="space-y-1">
                    <AnimatePresence initial={false}>
                        {list.map((u) => {
                            const initial = (u.name?.[0] ?? "U").toUpperCase();
                            const handle =
                                "@" + (u.email?.split("@")[0] ?? "user");

                            return (
                                <motion.div
                                    key={u.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{
                                        duration: 0.2,
                                        ease: "easeOut",
                                    }}
                                    className="group flex items-center gap-3 p-1.5 -mx-1.5 rounded-2xl hover:bg-indigo-50/70 transition-colors"
                                >
                                    <Link
                                        href={`/profile/${u.id}`}
                                        className="flex-shrink-0"
                                    >
                                        <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 shadow-sm">
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
                                                        <span className="text-xs font-bold text-white">
                                                            {initial}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>

                                    <div className="flex-1 min-w-0">
                                        <Link href={`/profile/${u.id}`}>
                                            <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate hover:text-indigo-600 transition-colors">
                                                {u.name}
                                            </p>
                                        </Link>
                                        <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                                            {handle}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button
                                            onClick={() => toggleFollow(u.id)}
                                            disabled={busyId === u.id}
                                            className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold transition-colors disabled:opacity-60 ${u.isFollowing
                                                ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                                                : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-200/60 hover:from-indigo-700 hover:to-purple-700"
                                                }`}
                                        >
                                            {busyId === u.id
                                                ? "..."
                                                : u.isFollowing
                                                    ? "Following"
                                                    : "Follow"}
                                        </button>

                                        <button
                                            onClick={() => messageUser(u.id)}
                                            className="p-1.5 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-100 transition-colors"
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
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            <Link
                href="/friends"
                className="block text-center w-full mt-3 sm:mt-4 text-xs sm:text-sm font-semibold text-indigo-600 hover:text-purple-600 transition-colors py-2 rounded-xl hover:bg-indigo-50"
            >
                Find more friends
            </Link>
        </div>
    );
}