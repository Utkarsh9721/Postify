// app/dashboard/SidebarLinks.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type IconName =
    | "home"
    | "user"
    | "users"
    | "message"
    | "bell"
    | "bookmark";

const ICONS: Record<IconName, ReactNode> = {
    home: (
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
    ),
    user: (
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
    ),
    users: (
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
    ),
    message: (
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
    ),
    bell: (
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
    ),
    bookmark: (
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
    ),
};

const LINKS: { icon: IconName; label: string; href: string }[] = [
    { icon: "home", label: "Home", href: "/dashboard" },
    { icon: "users", label: "Friends", href: "/friends" },
    { icon: "message", label: "Messages", href: "/messages" },
    { icon: "bell", label: "Notifications", href: "/notifications" },
    { icon: "user", label: "Profile", href: "/profile" },
];

export default function SidebarLinks({
    unreadNotifications,
    unreadMessages,
}: {
    unreadNotifications: number;
    unreadMessages: number;
}) {
    const pathname = usePathname();

    return (
        <nav className="space-y-1">
            {LINKS.map((link) => {
                const isActive =
                    pathname === link.href ||
                    (link.href !== "/dashboard" &&
                        pathname?.startsWith(link.href));

                const badge =
                    link.icon === "message" && unreadMessages > 0
                        ? unreadMessages
                        : link.icon === "bell" && unreadNotifications > 0
                            ? unreadNotifications
                            : 0;

                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${isActive
                                ? "bg-indigo-50 text-indigo-700"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                    >
                        {/* Active left bar */}
                        {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                        )}

                        {/* Icon */}
                        <svg
                            className={`relative z-10 w-5 h-5 flex-shrink-0 transition-colors duration-150 ${isActive
                                    ? "text-indigo-600"
                                    : "text-gray-500 group-hover:text-gray-700"
                                }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {ICONS[link.icon]}
                        </svg>

                        {/* Label */}
                        <span className="relative z-10 flex-1 truncate">
                            {link.label}
                        </span>

                        {/* Badge */}
                        {badge > 0 && (
                            <span
                                className={`relative z-10 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold text-white shadow-sm ${link.icon === "bell"
                                        ? "bg-gradient-to-br from-red-500 to-rose-500"
                                        : "bg-gradient-to-br from-indigo-500 to-purple-600"
                                    }`}
                            >
                                {badge > 99 ? "99+" : badge}
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}