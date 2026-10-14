// app/api/calls/initiate/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongo";
import { User, Call } from "@/lib/models";
import { pusherServer } from "@/lib/pusher";        // ← ADDED

export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        let payload: any;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET!);
        } catch {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { recipientId, callType } = await request.json();
        if (!recipientId || (callType !== "audio" && callType !== "video")) {
            return NextResponse.json({ message: "Invalid input" }, { status: 400 });
        }

        await connectDB();

        const me = await User.findById(payload.id ?? payload.userId)
            .select("name avatar")
            .lean();
        if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const room = [me._id.toString(), String(recipientId)].sort().join("__");

        // Cancel any stale ringing call from same caller
        await Call.deleteMany({
            caller: me._id,
            recipient: recipientId,
            status: "ringing",
        });

        const call = await Call.create({
            caller: me._id,
            recipient: recipientId,
            callType,
            room,
            status: "ringing",
        });

        // ─── Tell the recipient via Pusher ───
        try {
            await pusherServer.trigger(
                `private-user-${recipientId}`,
                "call:incoming",
                {
                    callId: call._id.toString(),
                    room,
                    callType,
                    caller: {
                        id: me._id.toString(),
                        name: me.name,
                        avatar: (me as any).avatar ?? "",
                    },
                }
            );
            console.log("✅ call:incoming fired to", recipientId);
        } catch (err) {
            console.error("❌ Pusher call trigger failed:", err);
        }

        return NextResponse.json({
            callId: call._id.toString(),
            room,
            caller: { id: me._id.toString(), name: me.name, avatar: (me as any).avatar ?? "" },
        });
    } catch (error) {
        console.error("Call initiate error:", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}