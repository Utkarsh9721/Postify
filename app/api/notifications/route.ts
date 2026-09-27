// app/api/notifications/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import { Notification, Post } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
   GET /api/notifications?limit=30
   Returns the user's notifications, newest first.
   ============================================================ */
export async function GET(req: Request) {
    try {
        const me = await getCurrentUser();
        if (!me) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const limit = Math.min(
            100,
            Math.max(1, parseInt(searchParams.get("limit") || "30", 10))
        );

        const notifications = await Notification.find({ recipient: me._id })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate("actor", "name email avatar")
            .populate("post", "content")
            .lean();

        const mapped = notifications.map((n: any) => ({
            id: n._id.toString(),
            type: n.type,
            read: n.read ?? false,
            createdAt: n.createdAt,
            actor: {
                id: n.actor?._id?.toString() ?? "",
                name: n.actor?.name ?? "Someone",
                email: n.actor?.email ?? "",
                avatar: n.actor?.avatar ?? "",
            },
            post: n.post
                ? {
                    id: n.post._id?.toString() ?? "",
                    content: n.post.content ?? "",
                }
                : null,
        }));

        const unreadCount = await Notification.countDocuments({
            recipient: me._id,
            read: false,
        });

        return NextResponse.json({ notifications: mapped, unreadCount });
    } catch (err) {
        console.error("GET /api/notifications error:", err);
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}

/* ============================================================
   PATCH /api/notifications
   Body: { action: "mark-all-read" }
   ============================================================ */
export async function PATCH(req: Request) {
    try {
        const me = await getCurrentUser();
        if (!me) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        if (body?.action === "mark-all-read") {
            await connectDB();
            await Notification.updateMany(
                { recipient: me._id, read: false },
                { $set: { read: true } }
            );
            return NextResponse.json({ ok: true });
        }

        return NextResponse.json(
            { message: "Unknown action" },
            { status: 400 }
        );
    } catch (err) {
        console.error("PATCH /api/notifications error:", err);
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}