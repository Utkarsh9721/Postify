// app/dashboard/MobileNav.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import {
    IconHome,
    IconUsers,
    IconBell,
    IconMessageCircle,
    IconUser,
} from "@tabler/icons-react";

type NavItem = {
    title: string;
    href: string;
    icon: React.ReactNode;
    badge?: number;
};

export default function MobileNav({
    unreadNotifications,
    unreadMessages,
}: {
    unreadNotifications: number;
    unreadMessages: number;
}) {
    const pathname = usePathname();
    const [hidden, setHidden] = useState(false);

    /* Hide dock when the on-screen keyboard opens */
    useEffect(() => {
        const vv = (window as any).visualViewport;
        if (!vv) return;

        const onResize = () => {
            const diff = window.innerHeight - vv.height;
            setHidden(diff > 200);
        };

        vv.addEventListener("resize", onResize);
        return () => vv.removeEventListener("resize", onResize);
    }, []);

    const items: NavItem[] = [
        {
            title: "Home",
            href: "/dashboard",
            icon: <IconHome className="h-full w-full" />,
        },
        {
            title: "Friends",
            href: "/friends",
            icon: <IconUsers className="h-full w-full" />,
        },
        {
            title: "Alerts",
            href: "/notifications",
            icon: <IconBell className="h-full w-full" />,
            badge: unreadNotifications,
        },
        {
            title: "Chats",
            href: "/messages",
            icon: <IconMessageCircle className="h-full w-full" />,
            badge: unreadMessages,
        },
        {
            title: "Profile",
            href: "/profile",
            icon: <IconUser className="h-full w-full" />,
        },
    ];

    return (
        <>
            {/* Gradient fade behind the dock */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-32 pointer-events-none bg-gradient-to-t from-white via-white/60 to-transparent" />

            {/* Dock */}
            <motion.nav
                initial={{ y: 100, opacity: 0 }}
                animate={{
                    y: hidden ? 120 : 0,
                    opacity: hidden ? 0 : 1,
                }}
                transition={{
                    duration: 0.4,
                    ease: [0.16, 1, 0.3, 1],
                }}
                className="lg:hidden fixed bottom-3 left-0 right-0 z-50 flex justify-center px-3"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
                aria-label="Main navigation"
            >
                <div className="flex items-center gap-1 rounded-full bg-neutral-900/95 backdrop-blur-2xl border border-white/10 px-2 py-1.5 shadow-[0_12px_48px_-8px_rgba(0,0,0,0.55)]">
                    {items.map((item) => {
                        const active =
                            pathname === item.href ||
                            (item.href !== "/dashboard" &&
                                pathname?.startsWith(item.href));

                        return (
                            <DockIcon
                                key={item.href}
                                item={item}
                                active={active}
                            />
                        );
                    })}
                </div>
            </motion.nav>
        </>
    );
}

/* ================================================================
   Single icon with hover / tap animation
   ================================================================ */
function DockIcon({ item, active }: { item: NavItem; active: boolean }) {
    return (
        <Link
            href={item.href}
            aria-label={item.title}
            className="relative flex items-center justify-center"
        >
            <motion.div
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-colors ${active
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/40"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                    }`}
            >
                <div className="w-5 h-5">{item.icon}</div>

                {item.badge && item.badge > 0 ? (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                        className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 bg-red-500 rounded-full text-[9px] font-bold text-white border-2 border-neutral-900"
                    >
                        {item.badge > 9 ? "9+" : item.badge}
                    </motion.span>
                ) : null}
            </motion.div>

            {active && (
                <motion.span
                    layoutId="activeDot"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                    }}
                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-indigo-400"
                />
            )}
        </Link>
    );
}