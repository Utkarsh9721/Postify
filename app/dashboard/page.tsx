// app/dashboard/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/mongo";

import LogoutButton from "./LogoutButton";
import PostComposer from "./PostComposer";
import PostCard from "./PostCard";
import SidebarLinks from "./SidebarLinks";
import MobileNav from "./MobileNav";
import StatsStrip from "./StatsStrip";
import ActivityItem from "./ActivityItem";
import FriendsCard, { type Person } from "./FriendsCard";
import { User, Post, Chat, Notification } from "@/lib/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Dashboard() {
    /* ---------------- AUTH ---------------- */
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) redirect("/login");

    let payload: any;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
        redirect("/login");
    }

    /* ---------------- DB ---------------- */
    await connectDB();

    const currentUser = await User.findOne(
        payload.id
            ? { _id: payload.id }
            : payload.userId
                ? { _id: payload.userId }
                : { email: payload.email }
    )
        .select("-password")
        .lean();

    if (!currentUser) redirect("/login");

    const userId = currentUser._id;

    /* ---------------- DATA ---------------- */
    const [posts, notifications, suggestedUsers] = await Promise.all([
        Post.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .populate("author", "name email avatar")
            .lean(),

        Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("actor", "name email avatar")
            .lean(),

        User.find({
            _id: { $ne: userId, $nin: currentUser.following ?? [] },
        })
            .select("name email avatar bio followers")
            .limit(5)
            .lean(),
    ]);

    /* ---------------- MAP ---------------- */
    const mappedPosts = posts.map((p: any) => ({
        id: p._id.toString(),
        author: p.author?.name ?? "Unknown",
        handle: "@" + (p.author?.email?.split("@")[0] ?? "user"),
        initial: (p.author?.name?.[0] ?? "U").toUpperCase(),
        avatar: p.author?.avatar ?? "",
        content: p.content ?? "",
        image: p.image ?? "",
        createdAt: timeAgo(p.createdAt),
        likesCount: p.likes?.length ?? 0,
        likedByMe:
            p.likes?.some((uid: any) => uid.toString() === userId.toString()) ?? false,
        commentsCount: p.comments?.length ?? 0,
        sharesCount: p.sharesCount ?? 0,
        isOwner: p.author?._id?.toString() === userId.toString(),
    }));

    const mappedNotifications = notifications.map((n: any) => ({
        id: n._id.toString(),
        type: n.type ?? "default",
        initial: (n.actor?.name?.[0] ?? "U").toUpperCase(),
        avatar: n.actor?.avatar ?? "",
        name: n.actor?.name ?? "Someone",
        action: notificationAction(n.type),
        time: timeAgo(n.createdAt),
        color: pickColor(n.actor?.name ?? "U"),
    }));

    const mappedSuggested: Person[] = suggestedUsers.map((u: any) => ({
        id: u._id.toString(),
        name: u.name ?? "Unknown",
        email: u.email ?? "",
        avatar: u.avatar ?? "",
        bio: u.bio ?? "",
        followersCount: u.followers?.length ?? 0,
        isFollowing: false,
    }));

    /* ---------------- UI ---------------- */
    const userInitial = (currentUser.name?.[0] ?? "U").toUpperCase();
    const userAvatar = currentUser.avatar ?? "";
    const userName = currentUser.name;
    const userHandle = "@" + currentUser.email.split("@")[0];

    const unreadNotifications = notifications.filter((n: any) => !n.read).length;
    const unreadMessages = 0;
    const myPostCount = posts.filter(
        (p: any) => p.author?._id?.toString() === userId.toString()
    ).length;

    const currentUserId = currentUser._id.toString();
    const followersCount = currentUser.followers?.length ?? 0;
    const followingCount = currentUser.following?.length ?? 0;

    return (
        <div className="relative min-h-screen bg-slate-50 pb-28 lg:pb-0">
            {/* ================= AMBIENT BACKGROUND ================= */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
                <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-200/40 blur-[100px]" />
                <div className="absolute -top-32 right-0 w-[28rem] h-[28rem] rounded-full bg-purple-200/30 blur-[110px]" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] rounded-full bg-pink-100/40 blur-[120px]" />

                <div
                    className="absolute inset-0 opacity-[0.015]"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(99,102,241,0.6) 1px, transparent 1px)," +
                            "linear-gradient(90deg, rgba(99,102,241,0.6) 1px, transparent 1px)",
                        backgroundSize: "64px 64px",
                        maskImage:
                            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
                        WebkitMaskImage:
                            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
                    }}
                />
            </div>

            {/* ================= NAVBAR ================= */}
            <nav className="sticky top-0 z-40 border-b border-white/40 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14 sm:h-16">
                        <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
                            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-300/40">
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
                            <span className="text-lg sm:text-xl font-bold text-gray-900 hidden sm:block">
                                Postify
                            </span>
                        </Link>

                        <form
                            action="/search"
                            method="get"
                            className="hidden md:flex flex-1 max-w-md mx-6"
                        >
                            <div className="relative w-full group">
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
                                    type="text"
                                    name="q"
                                    placeholder="Search people, posts..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-all"
                                />
                            </div>
                        </form>

                        <div className="flex items-center gap-1 sm:gap-2">
                            <Link
                                href="/search"
                                className="md:hidden p-2 rounded-xl hover:bg-gray-100 active:scale-95 transition-transform"
                                aria-label="Search"
                            >
                                <svg
                                    className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600"
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
                            </Link>

                            <Link
                                href="/notifications"
                                className="relative p-2 rounded-xl hover:bg-gray-100 active:scale-95 transition-transform"
                                aria-label="Notifications"
                            >
                                <svg
                                    className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600"
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
                                {unreadNotifications > 0 && (
                                    <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-gradient-to-br from-red-500 to-rose-500 rounded-full border-2 border-white text-[9px] font-bold text-white shadow-sm">
                                        {unreadNotifications > 9 ? "9+" : unreadNotifications}
                                    </span>
                                )}
                            </Link>

                            <Link
                                href="/messages"
                                className="relative p-2 rounded-xl hover:bg-gray-100 active:scale-95 transition-transform hidden sm:block"
                                aria-label="Messages"
                            >
                                <svg
                                    className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600"
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
                            </Link>

                            <div className="hidden sm:block">
                                <LogoutButton />
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ================= MAIN ================= */}
            <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                    {/* ---------------- LEFT: PROFILE ---------------- */}
                    <aside className="lg:col-span-3 space-y-4 order-2 lg:order-1">
                        <div className="group relative rounded-3xl bg-white/90 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden backdrop-blur-xl">
                            <div className="h-1 bg-gradient-to-r from-indigo-500/70 via-purple-500/90 to-pink-500/70" />

                            <div className="px-4 sm:px-5 pt-6 pb-4 sm:pb-5">
                                <Link href="/profile" className="flex justify-center mb-3">
                                    <div className="relative">
                                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[3px] bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 shadow-md transition-transform duration-300 hover:scale-105">
                                            <div className="w-full h-full rounded-full overflow-hidden bg-white">
                                                {userAvatar ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={userAvatar}
                                                        alt={userName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                                        <span className="text-2xl sm:text-3xl font-bold text-white">
                                                            {userInitial}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <span className="absolute bottom-1 right-1 flex h-3.5 w-3.5">
                                            <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                                            <span className="relative inline-flex w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                                        </span>
                                    </div>
                                </Link>

                                <div className="text-center">
                                    <Link
                                        href="/profile"
                                        className="inline-block text-base sm:text-lg font-bold text-gray-900 hover:text-indigo-600 transition-colors"
                                    >
                                        {userName}
                                    </Link>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                        {userHandle}
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3 leading-relaxed line-clamp-2 italic">
                                        {currentUser.bio || "Welcome to your dashboard 👋"}
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-gray-100">
                                    <div className="text-center py-1.5 rounded-xl hover:bg-indigo-50 transition-colors">
                                        <p className="text-base sm:text-lg font-bold text-indigo-600">
                                            {myPostCount}
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 font-medium">
                                            Posts
                                        </p>
                                    </div>
                                    <Link
                                        href={`/profile/${currentUserId}/followers`}
                                        className="text-center py-1.5 rounded-xl hover:bg-indigo-50 transition-colors"
                                    >
                                        <p className="text-base sm:text-lg font-bold text-indigo-600">
                                            {formatCount(followersCount)}
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 font-medium">
                                            Followers
                                        </p>
                                    </Link>
                                    <Link
                                        href={`/profile/${currentUserId}/following`}
                                        className="text-center py-1.5 rounded-xl hover:bg-indigo-50 transition-colors"
                                    >
                                        <p className="text-base sm:text-lg font-bold text-indigo-600">
                                            {formatCount(followingCount)}
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 font-medium">
                                            Following
                                        </p>
                                    </Link>
                                </div>

                                <Link
                                    href="/profile/edit"
                                    className="block text-center w-full mt-4 sm:mt-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-200/60 hover:shadow-lg active:scale-[0.98] transition-all"
                                >
                                    Edit Profile
                                </Link>
                            </div>
                        </div>

                        <div className="hidden lg:block rounded-3xl bg-white/90 border border-gray-100 shadow-sm p-3 backdrop-blur-xl">
                            <SidebarLinks
                                unreadNotifications={unreadNotifications}
                                unreadMessages={unreadMessages}
                            />
                        </div>
                    </aside>

                    {/* ---------------- CENTER: FEED ---------------- */}
                    <section className="lg:col-span-6 space-y-3 sm:space-y-4 order-1 lg:order-2">
                        <StatsStrip
                            posts={myPostCount}
                            followers={followersCount}
                            following={followingCount}
                            notifications={unreadNotifications}
                        />

                        <PostComposer userInitial={userInitial} userAvatar={userAvatar} />

                        {mappedPosts.length === 0 ? (
                            <EmptyState
                                title="No posts yet"
                                message="When you or people you follow post something, it will appear here."
                            />
                        ) : (
                            mappedPosts.map((post, i) => (
                                <PostCard key={post.id} {...post} priority={i === 0} />
                            ))
                        )}
                    </section>

                    {/* ---------------- RIGHT ---------------- */}
                    <aside className="lg:col-span-3 space-y-4 order-3">
                        <div className="rounded-3xl bg-white/90 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-5 backdrop-blur-xl">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <h3 className="text-sm sm:text-base font-bold text-gray-900">
                                    Notifications
                                </h3>
                                {unreadNotifications > 0 && (
                                    <span className="text-[10px] sm:text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 px-2.5 py-0.5 rounded-full shadow-sm">
                                        {unreadNotifications} new
                                    </span>
                                )}
                            </div>
                            {mappedNotifications.length === 0 ? (
                                <div className="py-6 text-center">
                                    <p className="text-xs text-gray-400">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3 sm:space-y-4">
                                    {mappedNotifications.map((n) => (
                                        <ActivityItem key={n.id} {...n} />
                                    ))}
                                </div>
                            )}
                            <Link
                                href="/notifications"
                                className="block text-center w-full mt-3 sm:mt-4 text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors py-2 rounded-xl hover:bg-indigo-50"
                            >
                                View all
                            </Link>
                        </div>

                        {mappedSuggested.length > 0 && (
                            <FriendsCard users={mappedSuggested} />
                        )}
                    </aside>
                </div>
            </main>

            <MobileNav
                unreadNotifications={unreadNotifications}
                unreadMessages={unreadMessages}
            />
        </div>
    );
}

/* ================================================================
   HELPERS
   ================================================================ */

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

function formatCount(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
    return String(n);
}

function notificationAction(type: string): string {
    switch (type) {
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

/* ================================================================
   EMPTY STATE
   ================================================================ */

function EmptyState({ title, message }: { title: string; message: string }) {
    return (
        <div className="relative rounded-3xl bg-white/90 border border-gray-100 shadow-sm p-10 sm:p-12 text-center backdrop-blur-xl overflow-hidden">
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-gradient-to-br from-indigo-300/40 to-purple-300/40 blur-3xl pointer-events-none" />

            <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <svg
                        className="w-9 h-9 text-indigo-500"
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
                <p className="text-base font-semibold text-gray-900">{title}</p>
                <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto leading-relaxed">
                    {message}
                </p>
            </div>
        </div>
    );
}