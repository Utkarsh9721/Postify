// app/dashboard/NavbarBadges.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { usePusherEvent } from "@/lib/PusherProvider";

export default function NavbarBadges({
  initialNotifications,
  initialMessages,
}: {
  initialNotifications: number;
  initialMessages: number;
}) {
  const [notifCount, setNotifCount] = useState(initialNotifications);
  const [msgCount, setMsgCount] = useState(initialMessages);

  usePusherEvent("notification:new", () => {
    setNotifCount((n) => n + 1);
  });

  usePusherEvent("message:new", () => {
    setMsgCount((n) => n + 1);
  });

  return (
    <>
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
        {notifCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-gradient-to-br from-red-500 to-rose-500 rounded-full border-2 border-white text-[9px] font-bold text-white shadow-sm">
            {notifCount > 9 ? "9+" : notifCount}
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
        {msgCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full border-2 border-white text-[9px] font-bold text-white shadow-sm">
            {msgCount > 9 ? "9+" : msgCount}
          </span>
        )}
      </Link>
    </>
  );
}
