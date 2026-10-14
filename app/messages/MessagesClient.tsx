// app/messages/MessagesClient.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import NewChatModal from "./NewChatModal";
import { usePusherEvent } from "@/lib/PusherProvider";

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
  const [mobileShowChat, setMobileShowChat] = useState(Boolean(initialChatId));
  const [showNewChat, setShowNewChat] = useState(false);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  const activeChat = chats.find((c) => c.id === activeId) ?? null;

  usePusherEvent(
    "message:new",
    (data: { chatId: string; message: MessageItem }) => {
      if (data.chatId === activeId) {
        setMessages((prev) =>
          prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]
        );
      }
      setChats((prev) => {
        const updated = prev.map((c) =>
          c.id === data.chatId
            ? {
                ...c,
                lastMessage: {
                  content: data.message.content,
                  isMine: false,
                  createdAt: data.message.createdAt,
                },
                updatedAt: new Date().toISOString(),
              }
            : c
        );
        return updated.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
    }
  );

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

  useEffect(() => {
    if (!openMenuId) return;
    const onClickAway = () => {
      setOpenMenuId(null);
      setConfirmingDeleteId(null);
    };
    window.addEventListener("click", onClickAway);
    return () => window.removeEventListener("click", onClickAway);
  }, [openMenuId]);

  useEffect(() => {
    setOpenMenuId(null);
    setConfirmingDeleteId(null);
    setDeletingId(null);
  }, [activeId]);

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
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
    } catch {
      alert("Network error");
      setText(content);
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(messageId: string) {
    if (deletingId) return;
    setOpenMenuId(null);
    setConfirmingDeleteId(null);
    setDeletingId(messageId);

    const previousMessages = messages;
    const previousChats = chats;

    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeId && c.lastMessage ? { ...c, lastMessage: null } : c
      )
    );

    try {
      const res = await fetch("/api/messages/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessages(previousMessages);
        setChats(previousChats);
        alert(data.message || "Failed to delete message");
      }
    } catch {
      setMessages(previousMessages);
      setChats(previousChats);
      alert("Network error. Try again.");
    } finally {
      setDeletingId(null);
    }
  }

  function openChat(id: string) {
    setActiveId(id);
    setMobileShowChat(true);
    setOpenMenuId(null);
    setConfirmingDeleteId(null);
  }

  async function startCall(type: "audio" | "video") {
    if (!activeChat) return;
    const otherUserId = activeChat.other.id;

    try {
      const res = await fetch("/api/calls/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: otherUserId, callType: type }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Call initiate failed:", data.message);
      }
    } catch (err) {
      console.error("Call initiate network error:", err);
    }

    router.push(`/call/${otherUserId}?to=${otherUserId}&type=${type}`);
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
      router.replace(`/messages?chat=${data.chat.id}`, { scroll: false });
    } catch {
      alert("Network error");
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40 pb-28 lg:pb-0">
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-200/40 blur-[100px]" />
      </div>

      <nav className="sticky top-0 z-40 border-b border-gray-100 bg-white/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-lg sm:text-xl font-bold text-gray-900 hidden sm:block">Socially</span>
            </Link>
            <button
              onClick={() => setShowNewChat(true)}
              className="px-4 py-2 rounded-full text-white text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 shadow-sm hover:from-indigo-700 hover:to-purple-700 active:scale-95 transition-transform flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="relative rounded-3xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 h-[calc(100dvh-160px)] sm:h-[calc(100dvh-180px)]">
            <aside className={`md:col-span-1 border-r border-gray-100 overflow-y-auto ${mobileShowChat ? "hidden md:block" : "block"}`}>
              {chats.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm font-semibold text-gray-700">No conversations yet</p>
                  <button onClick={() => setShowNewChat(true)} className="mt-4 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold">
                    Start chatting
                  </button>
                </div>
              ) : (
                <ul className="py-2">
                  {chats.map((c) => {
                    const active = c.id === activeId;
                    const initial = (c.other.name?.[0] ?? "U").toUpperCase();
                    return (
                      <li key={c.id} className="px-2">
                        <button
                          onClick={() => openChat(c.id)}
                          className={`relative w-full flex items-center gap-3 px-3 py-2.5 my-0.5 text-left rounded-2xl transition-colors ${active ? "bg-indigo-50" : "hover:bg-gray-50"}`}
                        >
                          <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 flex-shrink-0 shadow-sm">
                            <div className="w-full h-full rounded-full overflow-hidden bg-white">
                              {c.other.avatar ? (
                                <img src={c.other.avatar} alt="" className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                                  <span className="text-sm font-bold text-white">{initial}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${active ? "text-indigo-700" : "text-gray-900"}`}>
                              {c.other.name ?? c.other.email}
                            </p>
                            <p className={`text-xs truncate mt-0.5 ${active ? "text-indigo-500" : "text-gray-500"}`}>
                              {c.lastMessage ? `${c.lastMessage.isMine ? "You: " : ""}${c.lastMessage.content}` : "No messages yet"}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </aside>

            <section className={`md:col-span-2 flex flex-col ${mobileShowChat ? "block" : "hidden md:flex"}`}>
              {!activeChat ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                  <p className="text-sm font-semibold text-gray-700">Select a conversation</p>
                </div>
              ) : (
                <>
                  <header className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-white">
                    <Link href={`/profile/${activeChat.other.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative w-10 h-10 rounded-full p-[2px] bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 shadow-sm flex-shrink-0">
                        <div className="w-full h-full rounded-full overflow-hidden bg-white">
                          {activeChat.other.avatar ? (
                            <img src={activeChat.other.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                              <span className="text-xs font-bold text-white">
                                {(activeChat.other.name?.[0] ?? "U").toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {activeChat.other.name ?? activeChat.other.email}
                        </p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button onClick={() => startCall("audio")} className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 active:scale-90 transition-all" aria-label="Audio call">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </button>
                      <button onClick={() => startCall("video")} className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 active:scale-90 transition-all" aria-label="Video call">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </header>

                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
                    {loadingMessages ? (
                      <div className="flex justify-center pt-4">
                        <div className="w-5 h-5 rounded-full border-2 border-indigo-200 border-t-indigo-500 animate-spin" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <p className="text-xs text-gray-400">No messages yet. Say hi!</p>
                      </div>
                    ) : (
                      messages.map((m) => {
                        const isDeleting = deletingId === m.id;
                        const isMenuOpen = openMenuId === m.id;
                        const isConfirming = confirmingDeleteId === m.id;
                        return (
                          <div key={m.id} className={`group flex ${m.isMine ? "justify-end" : "justify-start"}`}>
                            <div className="relative max-w-[75%]">
                              <div className={`px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm transition-opacity ${isDeleting ? "opacity-40" : "opacity-100"} ${m.isMine ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl rounded-br-md" : "bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-bl-md"}`}>
                                {m.content}
                                <div className={`text-[10px] mt-1 ${m.isMine ? "text-white/70" : "text-gray-400"}`}>
                                  {timeAgo(m.createdAt)}
                                </div>
                              </div>
                              {m.isMine && !isDeleting && (
                                <div
                                  className={`absolute top-1 z-30 left-0 -translate-x-full pr-1 ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => setOpenMenuId(isMenuOpen ? null : m.id)}
                                    aria-label="Message options"
                                    className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                    </svg>
                                  </button>
                                  {isMenuOpen && (
                                    <div className="absolute top-full mt-1 left-0 z-40 w-44 rounded-xl border border-gray-100 bg-white shadow-lg overflow-hidden">
                                      {!isConfirming ? (
                                        <button
                                          type="button"
                                          onClick={() => setConfirmingDeleteId(m.id)}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                                          </svg>
                                          Delete
                                        </button>
                                      ) : (
                                        <div className="p-2">
                                          <p className="text-xs text-gray-700 px-1 pb-2 font-medium">Delete this message?</p>
                                          <div className="flex gap-1">
                                            <button
                                              type="button"
                                              onClick={() => handleDelete(m.id)}
                                              disabled={isDeleting}
                                              className="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium text-white bg-red-500 hover:bg-red-600 active:scale-95 disabled:opacity-60 transition-all"
                                            >
                                              Delete
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setConfirmingDeleteId(null);
                                                setOpenMenuId(null);
                                              }}
                                              className="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={bottomRef} />
                  </div>

                  <div className="border-t border-gray-100 p-3 flex items-center gap-2 bg-white">
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      maxLength={2000}
                      className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-colors"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !text.trim()}
                      className="px-5 py-2.5 rounded-full text-white text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:from-indigo-700 hover:to-purple-700 active:scale-95 transition-transform"
                    >
                      {sending ? "..." : "Send"}
                    </button>
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
