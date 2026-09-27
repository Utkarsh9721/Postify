// app/messages/MessagesClient.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import NewChatModal from "./NewChatModal";

type ChatSummary = {
    id: string;
    other: {
        id: string;
        name: string;
        email: string;
        avatar: string;
    };
    lastMessage: {
        content: string;
        isMine: boolean;
        createdAt: string;
    } | null;
    updatedAt: string;
};

type MessageItem = {
    id: string;
    content: string;
    createdAt: string;
    isMine: boolean;
    sender: {
        id: string;
        name: string;
        avatar: string;
    };
};

export default function MessagesClient({
    currentUser,
    initialChats,
    initialChatId,
}: {
    currentUser: { id: string; name: string; email: string };
    initialChats: ChatSummary[];
    initialChatId: string | null;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [chats, setChats] = useState<ChatSummary[]>(initialChats);
    const [activeId, setActiveId] = useState<string | null>(
        initialChatId ?? initialChats[0]?.id ?? null
    );
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [mobileShowChat, setMobileShowChat] = useState(
        Boolean(initialChatId)
    );
    const [showNewChat, setShowNewChat] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);

    const activeChat = chats.find((c) => c.id === activeId) ?? null;

    useEffect(() => {
        if (!activeId) return;
        const current = searchParams.get("chat");
        if (current !== activeId) {
            router.replace(`/messages?chat=${activeId}`, { scroll: false });
        }
    }, [activeId, router, searchParams]);

    useEffect(() => {
        if (!activeId) return;
        let cancelled = false;

        async function load() {
            setLoadingMessages(true);
            try {
                const res = await fetch(`/api/chats/${activeId}/messages`);
                const data = await res.json();
                if (!cancelled && res.ok) {
                    setMessages(data.messages || []);
                }
            } catch {
                // ignore
            } finally {
                if (!cancelled) setLoadingMessages(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [activeId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function sendMessage() {
        if (!text.trim() || !activeId || sending) return;
        setSending(true);
        const content = text.trim();
        setText("");

        try {
            const res = await fetch(`/api/chats/${activeId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Failed to send");
                setText(content);
                return;
            }

            setMessages((prev) => [...prev, data.message]);

            setChats((prev) => {
                const updated = prev.map((c) =>
                    c.id === activeId
                        ? {
                            ...c,
                            lastMessage: {
                                content,
                                isMine: true,
                                createdAt: new Date().toISOString(),
                            },
                            updatedAt: new Date().toISOString(),
                        }
                        : c
                );
                return updated.sort(
                    (a, b) =>
                        new Date(b.updatedAt).getTime() -
                        new Date(a.updatedAt).getTime()
                );
            });
        } catch {
            alert("Network error");
            setText(content);
        } finally {
            setSending(false);
        }
    }

    function openChat(id: string) {
        setActiveId(id);
        setMobileShowChat(true);
    }

    async function startChatWith(userId: string) {
        setShowNewChat(false);
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

            const chatsRes = await fetch("/api/chats");
            const chatsData = await chatsRes.json();
            if (chatsRes.ok) {
                setChats(chatsData.chats || []);
            }

            setActiveId(data.chat.id);
            setMobileShowChat(true);
            router.replace(`/messages?chat=${data.chat.id}`, {
                scroll: false,
            });
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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowNewChat(true)}
                            className="relative px-4 py-2 rounded-full text-white text-sm font-semibold overflow-hidden group shadow-lg shadow-indigo-300/40 hover:shadow-xl hover:shadow-indigo-400/50 transition-all duration-300 flex items-center gap-1.5"
                        >
                            <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-[length:200%_100%] group-hover:animate-[gradient_2s_ease_infinite]" />
                            <svg
                                className="relative w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            <span className="relative">New</span>
                        </motion.button>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
                <div className="relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_-12px_rgba(99,102,241,0.15)] overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-3 h-[calc(100dvh-160px)] sm:h-[calc(100dvh-180px)]">
                        {/* ─── LEFT: chat list ─── */}
                        <aside
                            className={`md:col-span-1 border-r border-white/60 overflow-y-auto ${mobileShowChat ? "hidden md:block" : "block"
                                }`}
                        >
                            {chats.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 ring-1 ring-white/80 shadow-inner flex items-center justify-center mx-auto mb-3">
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
                                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">
                                        No conversations yet
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1 mb-4">
                                        Start a new chat to see it here
                                    </p>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowNewChat(true)}
                                        className="relative px-4 py-2 rounded-full text-white text-xs font-semibold overflow-hidden shadow-lg shadow-indigo-300/40"
                                    >
                                        <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600" />
                                        <span className="relative">
                                            Start chatting
                                        </span>
                                    </motion.button>
                                </div>
                            ) : (
                                <ul className="py-2">
                                    <AnimatePresence initial={false}>
                                        {chats.map((c) => {
                                            const active = c.id === activeId;
                                            const initial = (
                                                c.other.name?.[0] ?? "U"
                                            ).toUpperCase();

                                            return (
                                                <motion.li
                                                    key={c.id}
                                                    layout
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{
                                                        opacity: 1,
                                                        y: 0,
                                                    }}
                                                    exit={{ opacity: 0, y: -8 }}
                                                    transition={{
                                                        duration: 0.25,
                                                        ease: "easeOut",
                                                    }}
                                                    className="px-2"
                                                >
                                                    <button
                                                        onClick={() =>
                                                            openChat(c.id)
                                                        }
                                                        className={`relative w-full flex items-center gap-3 px-3 py-2.5 my-0.5 text-left rounded-2xl transition-all duration-300 group ${active
                                                                ? "bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border border-indigo-100"
                                                                : "hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 border border-transparent"
                                                            }`}
                                                    >
                                                        {/* Active left bar */}
                                                        {active && (
                                                            <motion.span
                                                                layoutId="chat-active-bar"
                                                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-indigo-500 to-purple-500"
                                                                transition={{
                                                                    type: "spring",
                                                                    stiffness: 380,
                                                                    damping: 32,
                                                                }}
                                                            />
                                                        )}

                                                        {/* Avatar with gradient ring */}
                                                        <div className="relative w-11 h-11 rounded-full p-[2px] bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 flex-shrink-0 shadow-sm">
                                                            <div className="w-full h-full rounded-full overflow-hidden bg-white">
                                                                {c.other
                                                                    .avatar ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img
                                                                        src={
                                                                            c
                                                                                .other
                                                                                .avatar
                                                                        }
                                                                        alt={
                                                                            c
                                                                                .other
                                                                                .name
                                                                        }
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                                                        <span className="text-sm font-bold text-white">
                                                                            {
                                                                                initial
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <p
                                                                    className={`text-sm font-semibold truncate ${active
                                                                            ? "text-indigo-700"
                                                                            : "text-gray-900"
                                                                        }`}
                                                                >
                                                                    {
                                                                        c.other
                                                                            .name
                                                                    }
                                                                </p>
                                                                {c.lastMessage && (
                                                                    <span className="text-[10px] text-gray-400 flex-shrink-0">
                                                                        {timeAgo(
                                                                            c
                                                                                .lastMessage
                                                                                .createdAt
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p
                                                                className={`text-xs truncate mt-0.5 ${active
                                                                        ? "text-indigo-500/80"
                                                                        : "text-gray-500"
                                                                    }`}
                                                            >
                                                                {c.lastMessage
                                                                    ? `${c
                                                                        .lastMessage
                                                                        .isMine
                                                                        ? "You: "
                                                                        : ""
                                                                    }${c
                                                                        .lastMessage
                                                                        .content
                                                                    }`
                                                                    : "No messages yet"}
                                                            </p>
                                                        </div>
                                                    </button>
                                                </motion.li>
                                            );
                                        })}
                                    </AnimatePresence>
                                </ul>
                            )}
                        </aside>

                        {/* ─── RIGHT: chat view ─── */}
                        <section
                            className={`md:col-span-2 flex flex-col ${mobileShowChat ? "block" : "hidden md:flex"
                                }`}
                        >
                            {!activeChat ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 ring-1 ring-white/80 shadow-inner flex items-center justify-center mb-4">
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
                                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">
                                        Select a conversation
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Or start a new one
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Chat header */}
                                    <header className="flex items-center gap-3 px-4 py-3 border-b border-white/60 bg-white/40 backdrop-blur-sm">
                                        <button
                                            onClick={() =>
                                                setMobileShowChat(false)
                                            }
                                            className="md:hidden p-2 -ml-2 rounded-full text-gray-500 hover:bg-white/60 active:scale-90 transition-all"
                                            aria-label="Back"
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
                                                    d="M15 19l-7-7 7-7"
                                                />
                                            </svg>
                                        </button>
                                        <Link
                                            href={`/profile/${activeChat.other.id}`}
                                            className="flex items-center gap-3 flex-1 min-w-0 group"
                                        >
                                            <div className="relative w-10 h-10 rounded-full p-[2px] bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 shadow-sm group-hover:shadow-md transition-all">
                                                <div className="w-full h-full rounded-full overflow-hidden bg-white">
                                                    {activeChat.other
                                                        .avatar ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={
                                                                activeChat
                                                                    .other
                                                                    .avatar
                                                            }
                                                            alt={
                                                                activeChat
                                                                    .other.name
                                                            }
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                                            <span className="text-xs font-bold text-white">
                                                                {(
                                                                    activeChat
                                                                        .other
                                                                        .name?.[0] ??
                                                                    "U"
                                                                ).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Online dot */}
                                                <span className="absolute bottom-0 right-0 flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white" />
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                    {activeChat.other.name}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    @
                                                    {activeChat.other.email?.split(
                                                        "@"
                                                    )[0] ?? "user"}
                                                </p>
                                            </div>
                                        </Link>
                                    </header>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                                        {loadingMessages ? (
                                            <div className="flex justify-center pt-4">
                                                <div className="w-5 h-5 rounded-full border-2 border-indigo-200 border-t-indigo-500 animate-spin" />
                                            </div>
                                        ) : messages.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-center">
                                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-3">
                                                    <svg
                                                        className="w-7 h-7 text-indigo-400"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                        />
                                                    </svg>
                                                </div>
                                                <p className="text-xs text-gray-400">
                                                    No messages yet. Say hi!
                                                </p>
                                            </div>
                                        ) : (
                                            messages.map((m, i) => (
                                                <motion.div
                                                    key={m.id}
                                                    initial={{
                                                        opacity: 0,
                                                        y: 8,
                                                        scale: 0.95,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        y: 0,
                                                        scale: 1,
                                                    }}
                                                    transition={{
                                                        duration: 0.2,
                                                        delay: Math.min(
                                                            i * 0.02,
                                                            0.2
                                                        ),
                                                    }}
                                                    className={`flex ${m.isMine
                                                            ? "justify-end"
                                                            : "justify-start"
                                                        }`}
                                                >
                                                    <div
                                                        className={`group relative max-w-[75%] px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${m.isMine
                                                                ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl rounded-br-md shadow-indigo-300/40"
                                                                : "bg-white/80 backdrop-blur-sm border border-white/60 text-gray-800 rounded-2xl rounded-bl-md"
                                                            }`}
                                                    >
                                                        {m.content}
                                                        <div
                                                            className={`text-[10px] mt-1 ${m.isMine
                                                                    ? "text-white/70"
                                                                    : "text-gray-400"
                                                                }`}
                                                        >
                                                            {timeAgo(
                                                                m.createdAt
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                        <div ref={bottomRef} />
                                    </div>

                                    {/* Composer */}
                                    <div className="border-t border-white/60 p-3 flex items-center gap-2 bg-white/40 backdrop-blur-sm">
                                        <input
                                            value={text}
                                            onChange={(e) =>
                                                setText(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key === "Enter" &&
                                                    !e.shiftKey
                                                ) {
                                                    e.preventDefault();
                                                    sendMessage();
                                                }
                                            }}
                                            placeholder="Type a message..."
                                            maxLength={2000}
                                            className="flex-1 px-4 py-2.5 rounded-full border border-white/60 bg-white/70 backdrop-blur-sm text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 focus:bg-white transition-all"
                                        />
                                        <motion.button
                                            whileTap={{
                                                scale:
                                                    sending || !text.trim()
                                                        ? 1
                                                        : 0.92,
                                            }}
                                            onClick={sendMessage}
                                            disabled={
                                                sending || !text.trim()
                                            }
                                            className="relative px-5 py-2.5 rounded-full text-white text-sm font-semibold overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-300/40 hover:shadow-xl hover:shadow-indigo-400/50 transition-all group"
                                        >
                                            <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-[length:200%_100%] group-hover:animate-[gradient_2s_ease_infinite]" />
                                            <span className="relative flex items-center gap-1.5">
                                                {sending ? (
                                                    <>
                                                        <svg
                                                            className="w-4 h-4 animate-spin"
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
                                                    </>
                                                ) : (
                                                    <>
                                                        Send
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
                                                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                                                            />
                                                        </svg>
                                                    </>
                                                )}
                                            </span>
                                        </motion.button>
                                    </div>
                                </>
                            )}
                        </section>
                    </div>
                </div>
            </main>

            <NewChatModal
                open={showNewChat}
                onClose={() => setShowNewChat(false)}
                onPick={startChatWith}
            />
        </div>
    );
}

function timeAgo(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString();
}