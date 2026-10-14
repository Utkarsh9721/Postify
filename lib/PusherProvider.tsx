// lib/PusherProvider.tsx
"use client";

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import PusherClient, { type Channel } from "pusher-js";

type Listener = (data: any) => void;

type PusherContextValue = {
    channel: Channel | null;
    connected: boolean;
    on: (event: string, fn: Listener) => () => void;
};

const PusherContext = createContext<PusherContextValue>({
    channel: null,
    connected: false,
    on: () => () => { },
});

/* ─────────────────────────────────────────────────────────────
   Module-level singletons. These live outside React so that
   StrictMode remounts, route changes, and hot reloads don't
   kill the WebSocket mid-handshake.
   ───────────────────────────────────────────────────────────── */
let singletonClient: PusherClient | null = null;
let singletonChannel: Channel | null = null;
let singletonChannelName: string | null = null;

function getOrCreateClient(key: string, cluster: string): PusherClient {
    if (singletonClient) return singletonClient;

    console.log("[Pusher] Creating singleton client");
    singletonClient = new PusherClient(key, {
        cluster,
        authEndpoint: "/api/pusher/auth",
    });

    singletonClient.connection.bind("state_change", (states: any) => {
        console.log("[Pusher] connection:", states.previous, "→", states.current);
    });

    return singletonClient;
}

function getOrCreateChannel(
    client: PusherClient,
    channelName: string
): Channel {
    // If we already have this exact channel, reuse it
    if (singletonChannel && singletonChannelName === channelName) {
        return singletonChannel;
    }

    // If a different channel is subscribed, drop it first
    if (singletonChannel && singletonChannelName) {
        client.unsubscribe(singletonChannelName);
    }

    console.log("[Pusher] Subscribing to", channelName);
    singletonChannel = client.subscribe(channelName);
    singletonChannelName = channelName;
    return singletonChannel;
}

export function PusherProvider({
    userId,
    children,
}: {
    userId: string;
    children: ReactNode;
}) {
    const [channel, setChannel] = useState<Channel | null>(null);
    const [connected, setConnected] = useState(false);
    const listenersRef = useRef<Map<string, Set<Listener>>>(new Map());
    const dispatcherRef = useRef<
        ((eventName: string, data: any) => void) | null
    >(null);

    useEffect(() => {
        if (!userId) return;

        const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
        const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
        if (!key || !cluster) {
            console.error("[Pusher] Missing NEXT_PUBLIC_PUSHER_KEY or CLUSTER");
            return;
        }

        const client = getOrCreateClient(key, cluster);
        const channelName = `private-user-${userId}`;
        const ch = getOrCreateChannel(client, channelName);

        /* ─── Subscription state callbacks ─── */
        const onSuccess = () => {
            console.log("[Pusher] ✅ Subscribed to", channelName);
            setConnected(true);
        };
        const onError = (err: any) => {
            console.error("[Pusher] ❌ Subscription failed:", err);
            setConnected(false);
        };

        // If the channel was already subscribed (StrictMode second mount),
        // mark connected immediately.
        if ((ch as any).subscribed) {
            setConnected(true);
        }

        ch.bind("pusher:subscription_succeeded", onSuccess);
        ch.bind("pusher:subscription_error", onError);

        /* ─── One-time global event dispatcher ─── */
        // bind_global is registered exactly once per channel. Every remount
        // would stack another dispatcher otherwise.
        if (!dispatcherRef.current) {
            dispatcherRef.current = (eventName: string, data: any) => {
                console.log("[Pusher] 📩 Event received:", eventName, data);
                const set = listenersRef.current.get(eventName);
                if (!set || set.size === 0) {
                    console.log("[Pusher] No listeners for", eventName);
                    return;
                }
                console.log(`[Pusher] Dispatching to ${set.size} listener(s)`);
                set.forEach((fn) => {
                    try {
                        fn(data);
                    } catch (err) {
                        console.error(
                            `[Pusher] Listener threw for ${eventName}:`,
                            err
                        );
                    }
                });
            };
            ch.bind_global(dispatcherRef.current);
        }

        setChannel(ch);

        return () => {
            // IMPORTANT: do NOT disconnect the client or unsubscribe the channel
            // here. React StrictMode runs cleanup immediately after mount, which
            // would kill the socket before it finishes connecting. We only remove
            // the subscription-state callbacks so they don't stack across remounts.
            ch.unbind("pusher:subscription_succeeded", onSuccess);
            ch.unbind("pusher:subscription_error", onError);
        };
    }, [userId]);

    function on(event: string, fn: Listener) {
        if (!listenersRef.current.has(event)) {
            listenersRef.current.set(event, new Set());
        }
        listenersRef.current.get(event)!.add(fn);
        console.log(
            `[Pusher] Listener registered: ${event} (total: ${listenersRef.current.get(event)!.size
            })`
        );
        return () => {
            const set = listenersRef.current.get(event);
            if (set) set.delete(fn);
        };
    }

    return (
        <PusherContext.Provider value={{ channel, connected, on }}>
            {children}
        </PusherContext.Provider>
    );
}

export function usePusher() {
    return useContext(PusherContext);
}

export function usePusherEvent(event: string, handler: Listener) {
    const { on } = usePusher();
    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    useEffect(() => {
        return on(event, (data) => handlerRef.current(data));
    }, [event, on]);
}