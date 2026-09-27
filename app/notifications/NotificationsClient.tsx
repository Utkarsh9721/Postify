// app/notifications/NotificationsClient.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";

type NotificationType =
    | "like"
    | "comment"
    | "follow"
    | "mention"
    | "message";

type Notif = {
    id: string;
    type: NotificationType;
    read: boolean;
    createdAt: string;
    actor: {
        id: string;
        name: string;
        email: string;
        avatar: string;
    };
    post: { id: string; content: string } | null;
};

export default function NotificationsClient({
    initialNotifications,
}: {
    initialNotifications: Notif[];
}) {
    const router = useRouter();
    const [notifications, setNotifications] = useState(initialNotifications);
    const [tab, setTab] = useState<"all" | "unread">("all");
    const [busyId, setBusyId] = useState<string | null>(null);
    const [markingAll, setMarkingAll] = useState(false);

    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.read).length,
        [notifications]
    );

    const filtered = useMemo(() => {
        if (tab === "unread") return notifications.filter((n) => !n.read);
        return notifications;
    }, [notifications, tab]);

    async function markRead(id: string) {
        setBusyId(id);
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        try {
            await fetch(`/api/notifications/${id}`, { method: "PATCH" });
            router.refresh();
        } catch {
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: false } : n))
            );
        } finally {
            setBusyId(null);
        }
    }

    async function markAllRead() {
        if (markingAll || unreadCount === 0) return;
        setMarkingAll(true);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "mark-all-read" }),
            });
            router.refresh();
        } catch {
            // ignore
        } finally {
            setMarkingAll(false);
        }
    }

    async function remove(id: string) {
        setBusyId(id);
        const backup = notifications;
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        try {
            await fetch(`/api/notifications/${id}`, { method: "DELETE" });
            router.refresh();
        } catch {
            setNotifications(backup);
        } finally {
            setBusyId(null);
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

            <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-between mb-5 gap-3"
                >
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent flex items-center gap-2">
                            Notifications
                            {unreadCount > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 500,
                                    }}
                                    className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-xs font-bold text-white bg-gradient-to-br from-red-500 to-rose-500 rounded-full shadow-md shadow-red-300/50"
                                >
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </motion.span>
                            )}
                        </h1>
                        {unreadCount > 0 && (
                            <p className="text-sm text-gray-500 mt-1">
                                {unreadCount} unread
                            </p>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={markAllRead}
                            disabled={markingAll}
                            className="relative px-4 py-2 rounded-full text-xs sm:text-sm font-semibold overflow-hidden shadow-sm hover:shadow-md transition-all disabled:opacity-60 group/btn"
                        >
                            <span className="absolute inset-0 bg-white/70 backdrop-blur-sm border border-white/60" />
                            <span className="absolute inset-0 bg-gradient-to-r from-indigo-50/0 via-indigo-50/60 to-purple-50/0 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                            <span className="relative flex items-center gap-1.5 text-gray-700 group-hover/btn:text-indigo-700">
                                {markingAll ? (
                                    <>
                                        <svg
                                            className="w-3.5 h-3.5 animate-spin"
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
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                            />
                                        </svg>
                                        Marking...
                                    </>
                                ) : (
                                    <>
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
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                        Mark all read
                                    </>
                                )}
                            </span>
                        </motion.button>
                    )}
                </motion.div>

                {/* Tabs */}
                <div className="flex gap-2 mb-5">
                    {[
                        { key: "all", label: "All" },
                        {
                            key: "unread",
                            label: unreadCount
                                ? `Unread (${unreadCount})`
                                : "Unread",
                        },
                    ].map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key as any)}
                            className={`relative px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-300 ${tab === t.key
                                    ? "text-white shadow-lg shadow-indigo-300/50"
                                    : "bg-white/60 backdrop-blur-sm text-gray-600 border border-white/60 hover:bg-white hover:text-gray-900"
                                }`}
                        >
                            {tab === t.key && (
                                <motion.span
                                    layoutId="notifs-tab-bg"
                                    className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600"
                                    transition={{
                                        type: "spring",
                                        stiffness: 380,
                                        damping: 32,
                                    }}
                                />
                            )}
                            <span className="relative">{t.label}</span>
                        </button>
                    ))}
                </div>

                {/* List */}
                <AnimatePresence mode="wait">
                    {filtered.length === 0 ? (
                        <EmptyState key={`empty-${tab}`} tab={tab} />
                    ) : (
                        <motion.div
                            key={`list-${tab}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                            className="space-y-2"
                        >
                            <AnimatePresence initial={false}>
                                {filtered.map((n, idx) => (
                                    <NotificationRow
                                        key={n.id}
                                        notif={n}
                                        busy={busyId === n.id}
                                        index={idx}
                                        onMarkRead={() => markRead(n.id)}
                                        onRemove={() => remove(n.id)}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

/* ================================================================
   ROW
   ================================================================ */

function NotificationRow({
    notif,
    busy,
    index,
    onMarkRead,
    onRemove,
}: {
    notif: Notif;
    busy: boolean;
    index: number;
    onMarkRead: () => void;
    onRemove: () => void;
}) {
    const initial = (notif.actor.name?.[0] ?? "U").toUpperCase();
    const color = pickColor(notif.actor.name);
    const href = linkFor(notif);
    const text = describe(notif);
    const typeIcon = typeIconFor(notif.type);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{
                duration: 0.25,
                delay: Math.min(index * 0.02, 0.2),
                ease: "easeOut",
            }}
            className={`group relative rounded-2xl border overflow-hidden transition-all duration-300 ${notif.read
                    ? "bg-white/70 backdrop-blur-xl border-white/60 hover:shadow-[0_8px_24px_-12px_rgba(99,102,241,0.2)] hover:border-white/80"
                    : "bg-gradient-to-br from-indigo-50/80 to-purple-50/80 backdrop-blur-xl border-indigo-100/60 shadow-[0_8px_24px_-12px_rgba(99,102,241,0.25)] hover:shadow-[0_12px_32px_-12px_rgba(99,102,241,0.35)]"
                }`}
        >
            {/* Unread left accent */}
            {!notif.read && (
                <motion.span
                    layoutId={`unread-${notif.id}`}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-indigo-500 to-purple-500"
                />
            )}

            {/* Soft corner glow */}
            <div className="pointer-events-none absolute -top-16 -right-16 w-32 h-32 rounded-full bg-gradient-to-br from-indigo-200/40 to-purple-200/40 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative flex items-start gap-3 p-3 sm:p-4">
                {/* Actor avatar with type badge */}
                <Link
                    href={`/profile/${notif.actor.id}`}
                    className="relative flex-shrink-0 group/avatar"
                >
                    <div className="relative w-11 h-11 rounded-full p-[2px] bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 shadow-sm group-hover/avatar:shadow-md group-hover/avatar:scale-105 transition-all duration-300">
                        <div className="w-full h-full rounded-full overflow-hidden bg-white">
                            {notif.actor.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={notif.actor.avatar}
                                    alt={notif.actor.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div
                                    className={`w-full h-full bg-gradient-to-br ${color} flex items-center justify-center`}
                                >
                                    <span className="text-sm font-bold text-white">
                                        {initial}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Type indicator badge */}
                    <div
                        className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center shadow-md border-2 border-white ${typeIcon.bg}`}
                    >
                        <span className="text-white">{typeIcon.icon}</span>
                    </div>
                </Link>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                    <Link href={href} onClick={onMarkRead}>
                        <p className="text-sm text-gray-700 leading-snug">
                            <span className="font-semibold text-gray-900">
                                {notif.actor.name}
                            </span>{" "}
                            <span className="text-gray-600">{text}</span>
                        </p>
                        {notif.post?.content && (
                            <div className="mt-1.5 px-3 py-2 rounded-xl bg-white/60 border border-white/80 backdrop-blur-sm">
                                <p className="text-xs text-gray-500 line-clamp-2 italic">
                                    &ldquo;{notif.post.content}&rdquo;
                                </p>
                            </div>
                        )}
                        <p className="text-[11px] sm:text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                            <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            {timeAgo(notif.createdAt)}
                        </p>
                    </Link>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {!notif.read && (
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={onMarkRead}
                            disabled={busy}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-indigo-500 hover:text-white hover:bg-gradient-to-br hover:from-indigo-500 hover:to-purple-600 transition-all"
                            aria-label="Mark as read"
                            title="Mark as read"
                        >
                            <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </motion.button>
                    )}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onRemove}
                        disabled={busy}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        aria-label="Remove"
                        title="Remove"
                    >
                        <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}

function EmptyState({ tab }: { tab: "all" | "unread" }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
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
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
            </div>
            <p className="relative text-sm font-semibold text-gray-700">
                {tab === "unread"
                    ? "No unread notifications"
                    : "No notifications yet"}
            </p>
            <p className="relative text-xs text-gray-400 mt-1">
                When someone interacts with you, it will appear here.
            </p>
        </motion.div>
    );
}

/* ================================================================
   HELPERS
   ================================================================ */

function describe(n: Notif): string {
    switch (n.type) {
        case "like":
            return "liked your post";
        case "comment":
            return "commented on your post";
        case "follow":
            return "started following you";
        case "mention":
            return "mentioned you in a post";
        case "message":
            return "sent you a message";
        default:
            return "interacted with you";
    }
}

function linkFor(n: Notif): string {
    switch (n.type) {
        case "like":
        case "comment":
        case "mention":
            return n.post ? `/post/${n.post.id}` : "/dashboard";
        case "follow":
            return `/profile/${n.actor.id}`;
        case "message":
            return "/messages";
        default:
            return "/dashboard";
    }
}

function typeIconFor(type: NotificationType): {
    bg: string;
    icon: React.ReactNode;
} {
    switch (type) {
        case "like":
            return {
                bg: "bg-gradient-to-br from-pink-500 to-rose-500",
                icon: (
                    <svg
                        className="w-2.5 h-2.5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                ),
            };
        case "comment":
            return {
                bg: "bg-gradient-to-br from-blue-500 to-indigo-500",
                icon: (
                    <svg
                        className="w-2.5 h-2.5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                ),
            };
        case "follow":
            return {
                bg: "bg-gradient-to-br from-green-500 to-emerald-500",
                icon: (
                    <svg
                        className="w-2.5 h-2.5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                ),
            };
        case "mention":
            return {
                bg: "bg-gradient-to-br from-orange-500 to-amber-500",
                icon: (
                    <svg
                        className="w-2.5 h-2.5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                ),
            };
        case "message":
            return {
                bg: "bg-gradient-to-br from-purple-500 to-fuchsia-500",
                icon: (
                    <svg
                        className="w-2.5 h-2.5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                ),
            };
        default:
            return {
                bg: "bg-gradient-to-br from-gray-500 to-slate-500",
                icon: (
                    <svg
                        className="w-2.5 h-2.5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
            };
    }
}

const COLORS = [
    "from-pink-400 to-rose-500",
    "from-blue-400 to-indigo-500",
    "from-green-400 to-emerald-500",
    "from-orange-400 to-amber-500",
    "from-purple-400 to-fuchsia-500",
    "from-teal-400 to-cyan-500",
];

function pickColor(seed: string): string {
    const i = seed.charCodeAt(0) % COLORS.length;
    return COLORS[i];
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