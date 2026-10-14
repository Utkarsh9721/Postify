import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongo";
import { Call } from "@/lib/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        if (!token) return NextResponse.json({ call: null });

        let payload: any;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET!);
        } catch {
            return NextResponse.json({ call: null });
        }

        await connectDB();

        const call = await Call.findOne({
            recipient: payload.id ?? payload.userId,
            status: "ringing",
        })
            .sort({ createdAt: -1 })
            .populate("caller", "name avatar")
            .lean();

        if (!call) return NextResponse.json({ call: null });

        return NextResponse.json({
            call: {
                id: call._id.toString(),
                room: call.room,
                callType: call.callType,
                caller: {
                    id: (call.caller as any)._id.toString(),
                    name: (call.caller as any).name,
                    avatar: (call.caller as any).avatar ?? "",
                },
            },
        });
    } catch (error) {
        console.error("Pending call error:", error);
        return NextResponse.json({ call: null });
    }
}