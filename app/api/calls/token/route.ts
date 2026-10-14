// app/api/calls/token/route.ts
import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongo";
import { User } from "@/lib/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { callType, otherUserId } = await request.json();
    if (!otherUserId) {
      return NextResponse.json(
        { message: "Missing otherUserId" },
        { status: 400 }
      );
    }
    if (callType !== "audio" && callType !== "video") {
      return NextResponse.json(
        { message: "Invalid callType" },
        { status: 400 }
      );
    }

    await connectDB();
    const me = await User.findById(payload.id ?? payload.userId)
      .select("name email")
      .lean();
    if (!me) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Deterministic room name — both users compute the same string
    const roomName = [me._id.toString(), String(otherUserId)]
      .sort()
      .join("__");

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      {
        identity: me._id.toString(),
        name: me.name,
        ttl: "1h",
      }
    );

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    return NextResponse.json({
      token: await at.toJwt(),
      room: roomName,
      url: process.env.NEXT_PUBLIC_LIVEKIT_URL,
    });
  } catch (error) {
    console.error("Call token error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
