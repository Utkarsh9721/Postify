// lib/usePusher.ts
"use client";

import { useEffect, useState } from "react";
import PusherClient, { type Channel } from "pusher-js";

let sharedClient: PusherClient | null = null;

function getClient() {
  if (!sharedClient) {
    sharedClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth",
    });
  }
  return sharedClient;
}

export function usePusherChannel(channelName: string | null) {
  const [channel, setChannel] = useState<Channel | null>(null);

  useEffect(() => {
    if (!channelName) return;
    const client = getClient();
    const ch = client.subscribe(channelName);
    setChannel(ch);
    return () => {
      client.unsubscribe(channelName);
      setChannel(null);
    };
  }, [channelName]);

  return channel;
}
