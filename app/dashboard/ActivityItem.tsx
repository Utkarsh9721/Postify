// app/dashboard/ActivityItem.tsx
"use client";

import Link from "next/link";

type ActivityItemProps = {
    id: string;
    type: string;
    initial: string;
    avatar: string;
    name: string;
    action: string;
    time: string;
    color: string;
};

function activityMeta(type: string) {
    switch (type) {
        case "like":
            return { bg: "bg-pink-100", fg: "text-pink-600" };
        case "comment":
            return { bg: "bg-indigo-100", fg: "text-indigo-600" };
        case "follow":
            return { bg: "bg-purple-100", fg: "text-purple-600" };
        case "mention":
            return { bg: "bg-cyan-100", fg: "text-cyan-600" };
        default:
            return { bg: "bg-gray-100", fg: "text-gray-600" };
    }
}

function ActivityIcon({ type, className }: { type: string; className?: string }) {
    switch (type) {
        case "like":
            return (
                <svg
                    className={className}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            );
        case "comment":
            return (
                <svg
                    className={className}
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
            );
        case "follow":
            return (
                <svg
                    className={className}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                </svg>
            );
        case "mention":
            return (
                <svg
                    className={className}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                </svg>
            );
        default:
            return (
                <svg
                    className={className}
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
            );
    }
}

export default function ActivityItem({
    type,
    initial,
    avatar,
    name,
    action,
    time,
}: ActivityItemProps) {
    const meta = activityMeta(type);

    return (
        <Link
            href="/notifications"
            className="group flex items-start gap-3 p-2 -mx-2 rounded-2xl hover:bg-indigo-50/60 transition-colors"
        >
            {/* Icon circle */}
            <div
                className={`w-9 h-9 rounded-full ${meta.bg} ${meta.fg} flex items-center justify-center flex-shrink-0 shadow-sm ring-2 ring-white`}
            >
                <ActivityIcon type={type} className="w-4 h-4" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-700 leading-snug">
                    <span className="font-semibold text-gray-900">{name}</span>{" "}
                    <span className="text-gray-600">{action}</span>
                </p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">{time}</p>
            </div>

            {/* Mini avatar on the right */}
            <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm opacity-90">
                {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={avatar}
                        alt={name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">
                            {initial}
                        </span>
                    </div>
                )}
            </div>
        </Link>
    );
}