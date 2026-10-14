"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type IncomingCall = {
    id: string;
    room: string;
    callType: "audio" | "video";
    caller: { id: string; name: string; avatar: string };
};

export default function IncomingCallListener() {
    const router = useRouter();
    const [call, setCall] = useState<IncomingCall | null>(null);
    const [busy, setBusy] = useState(false);

    // Poll every 3 seconds
    useEffect(() => {
        let cancelled = false;

        async function poll() {
            try {
                const res = await fetch("/api/calls/pending");
                const data = await res.json();
                if (!cancelled && data.call) setCall(data.call);
            } catch {
                // ignore
            }
        }

        poll();
        const interval = setInterval(poll, 3000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    async function respond(status: "accepted" | "declined") {
        if (!call || busy) return;
        setBusy(true);

        try {
            await fetch(`/api/calls/${call.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
        } catch {
            // ignore
        }

        if (status === "accepted") {
            router.push(`/call/${call.room}?to=${call.caller.id}&type=${call.callType}`);
        } else {
            setCall(null);
        }
        setBusy(false);
    }

    if (!call) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center gap-8 px-6">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-indigo-500/40 animate-ping" />
                    <div className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-white/20 shadow-2xl">
                        {call.caller.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={call.caller.avatar}
                                alt={call.caller.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold">
                                {call.caller.name?.[0]?.toUpperCase() ?? "U"}
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-white text-2xl font-bold">{call.caller.name}</p>
                    <p className="text-white/60 text-sm mt-1">
                        Incoming {call.callType} call…
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-12">
                <button
                    onClick={() => respond("declined")}
                    disabled={busy}
                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center shadow-lg disabled:opacity-60"
                    aria-label="Decline"
                >
                    <svg className="w-7 h-7 text-white rotate-[135deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                </button>

                <button
                    onClick={() => respond("accepted")}
                    disabled={busy}
                    className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center shadow-lg disabled:opacity-60"
                    aria-label="Accept"
                >
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}