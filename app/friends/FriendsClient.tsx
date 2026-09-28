// app/friends/FriendsClient.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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

export default function FriendsClient({
    me,
    initialUsers,
}: {
    me: { id: string; name: string; email: string };
    initialUsers: Person[];
}) {
    const router = useRouter();
    const [users, setUsers] = useState<Person[]>(initialUsers);
    const [query, setQuery] = useState("");
    const [busyId, setBusyId] = useState<string | null>(null);
    const [messagingId, setMessagingId] = useState<string | null>(null);
    const [tab, setTab] = useState<"all" | "following" | "followers">("all");

    const filtered = useMemo(() => {
        let list = users;

        if (tab === "following") list = list.filter((u) => u.isFollowing);
        if (tab === "followers") list = list.filter((u) => u.followsMe);

        if (query.trim()) {
            const q = query.trim().toLowerCase();
            list = list.filter(
                (u) =>
                    u.name.toLowerCase().includes(q) ||
                    u.email.toLowerCase().includes(q)
            );
        }

        return list;
    }, [users, tab, query]);

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

            if (!res.ok) throw new Error(data.message);

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
        setMessagingId(userId);
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
        } finally {
            setMessagingId(null);
        }
    }

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40 pb-20 lg:pb-0">
            {/* Single ambient orb */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
                <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-200/40 blur-[100px]" />
            </div>

            {/* Navbar */}
            <nav className="sticky top-0 z-40 border-b border-gray-100 bg-white/85 backdrop-blur-md">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14 sm:h-16">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2"
                        >
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
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
                            <span className="text-lg sm:text-xl font-bold text-gray-900">
                                Socially
                            </span>
                        </Link>
                        <Link
                            href="/dashboard"
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
                            Back to feed
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        Friends
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Follow people to see their posts, or start a chat
                    </p>
                </div>

                {/* Search */}
                <div className="relative mb-5 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        <svg
                            className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors"
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
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full pl-11 pr-12 py-3 sm:py-3.5 rounded-2xl border border-gray-200 bg-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery("")}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label="Clear"
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
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
                    {[
                        { key: "all", label: "All people" },
                        { key: "following", label: "Following" },
                        { key: "followers", label: "Followers" },
                    ].map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key as any)}
                            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${tab === t.key
                                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm"
                                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* List */}
                {filtered.length === 0 ? (
                    <EmptyState tab={tab} query={query} />
                ) : (
                    <div className="space-y-3">
                        {filtered.map((u) => (
                            <UserRow
                                key={u.id}
                                user={u}
                                busy={busyId === u.id}
                                messaging={messagingId === u.id}
                                onToggleFollow={() => toggleFollow(u.id)}
                                onMessage={() => messageUser(u.id)}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

/* ================================================================
   User row
   ================================================================ */
function UserRow({
    user,
    busy,
    messaging,
    onToggleFollow,
    onMessage,
}: {
    user: Person;
    busy: boolean;
    messaging: boolean;
    onToggleFollow: () => void;
    onMessage: () => void;
}) {
    const initial = (user.name?.[0] ?? "U").toUpperCase();
    const handle = "@" + (user.email?.split("@")[0] ?? "user");

    return (
        <div className="group relative rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 p-4 sm:p-5">
            <div className="flex items-start gap-3 sm:gap-4">
                {/* Avatar */}
                <Link href={`/profile/${user.id}`} className="flex-shrink-0">
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[3px] bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 shadow-sm">
                        <div className="w-full h-full rounded-full overflow-hidden bg-white">
                            {user.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                    <span className="text-lg sm:text-xl font-bold text-white">
                                        {initial}
                                    </span>
                                </div>
                            )}
                        </div>
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                    </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/profile/${user.id}`}>
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 hover:text-indigo-600 transition-colors truncate">
                                {user.name}
                            </h3>
                        </Link>
                        {user.followsMe && !user.isFollowing && (
                            <span className="text-[10px] sm:text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                                Follows you
                            </span>
                        )}
                        {user.isFollowing && user.followsMe && (
                            <span className="text-[10px] sm:text-xs font-semibold text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                                Friends
                            </span>
                        )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 truncate mt-0.5">
                        {handle}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1.5 sm:mt-2 leading-relaxed line-clamp-2">
                        {user.bio || "No bio yet"}
                    </p>

                    <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-3">
                        <span className="text-[11px] sm:text-xs text-gray-500">
                            <span className="font-semibold text-indigo-600">
                                {user.followersCount}
                            </span>{" "}
                            followers
                        </span>
                        <span className="text-[11px] sm:text-xs text-gray-500">
                            <span className="font-semibold text-indigo-600">
                                {user.followingCount}
                            </span>{" "}
                            following
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
                    <button
                        onClick={onToggleFollow}
                        disabled={busy}
                        className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${user.isFollowing
                                ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                                : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
                            }`}
                    >
                        {busy
                            ? "..."
                            : user.isFollowing
                                ? "Following"
                                : user.followsMe
                                    ? "Follow back"
                                    : "Follow"}
                    </button>

                    <button
                        onClick={onMessage}
                        disabled={messaging}
                        className="w-9 h-9 sm:w-auto sm:h-auto sm:px-4 sm:py-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-indigo-200 hover:text-indigo-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5 shadow-sm"
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
                        <span className="hidden sm:inline text-xs sm:text-sm font-semibold">
                            {messaging ? "..." : "Message"}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ================================================================
   Empty state
   ================================================================ */
function EmptyState({ tab, query }: { tab: string; query: string }) {
    const message = query
        ? `No one matches "${query}"`
        : tab === "following"
            ? "You haven't followed anyone yet"
            : tab === "followers"
                ? "No followers yet"
                : "No other users yet";

    return (
        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                <svg
                    className="w-8 h-8 text-indigo-400"
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
            <p className="text-sm font-semibold text-gray-700">{message}</p>
        </div>
    );
}