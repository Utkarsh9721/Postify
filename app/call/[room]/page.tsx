// app/call/[room]/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  GridLayout,
  ParticipantTile,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { usePusherEvent } from "@/lib/PusherProvider";     // ← ADDED
import "@livekit/components-styles";

type CallState = "loading" | "ready" | "error";

export default function CallPageWrapper() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <CallPage />
    </Suspense>
  );
}

function CallPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const otherUserId = searchParams.get("to") ?? "";
  const callType = (searchParams.get("type") ?? "video") as "audio" | "video";

  const [state, setState] = useState<CallState>("loading");
  const [token, setToken] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Hang up if the other side declines or ends the call
  usePusherEvent("call:end", () => {                       // ← ADDED
    router.push("/messages");
  });

  useEffect(() => {
    if (!otherUserId) {
      setErrorMsg("Missing call target");
      setState("error");
      return;
    }

    let cancelled = false;

    async function fetchToken() {
      try {
        const res = await fetch("/api/calls/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callType, otherUserId }),
        });
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setErrorMsg(data.message || "Could not start call");
          setState("error");
          return;
        }

        setToken(data.token);
        setServerUrl(data.url);
        setState("ready");
      } catch (err: any) {
        if (cancelled) return;
        console.error("Token fetch error:", err);
        setErrorMsg("Network error");
        setState("error");
      }
    }

    fetchToken();
    return () => {
      cancelled = true;
    };
  }, [callType, otherUserId]);

  if (state === "loading") return <LoadingScreen />;

  if (state === "error" || !token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white gap-4 px-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-sm text-white/70 text-center">{errorMsg || "Couldn't start the call"}</p>
        <button
          onClick={() => router.push("/messages")}
          className="px-6 py-3 rounded-full bg-white text-black text-sm font-semibold"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-black relative">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect
        video={callType === "video"}
        audio
        onDisconnected={() => router.push("/messages")}
        data-lk-theme="default"
        style={{ height: "100%" }}
      >
        {callType === "video" ? <VideoGrid /> : <AudioCallLayout />}
        <RoomAudioRenderer />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <ControlBar
            controls={{
              camera: callType === "video",
              screenShare: false,
              chat: false,
              microphone: true,
            }}
          />
        </div>
      </LiveKitRoom>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      <p className="mt-4 text-sm text-white/60">Connecting…</p>
    </div>
  );
}

function VideoGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <div className="h-full w-full pb-24">
      <GridLayout tracks={tracks} style={{ height: "100%" }}>
        <ParticipantTile />
      </GridLayout>
    </div>
  );
}

function AudioCallLayout() {
  const tracks = useTracks([Track.Source.Microphone], {
    onlySubscribed: false,
  });

  return (
    <div className="flex flex-col h-full pb-24">
      <div className="flex-1 grid grid-cols-2 gap-6 p-6 place-items-center">
        {tracks.map((t) => (
          <div key={t.participant.identity} className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {t.participant.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <p className="text-white/80 text-sm font-medium">
              {t.participant.name ?? t.participant.identity}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}