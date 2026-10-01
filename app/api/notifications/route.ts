// app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { Types } from "mongoose";
import connectDB from "@/lib/mongo";
import { Notification } from "@/lib/models";
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
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const limit = Math.min(
            100,
            Math.max(1, parseInt(searchParams.get("limit") || "30", 10))
        );

        const recipientId = new Types.ObjectId(me._id);

        // Fire notifications fetch + unread count in parallel
        const [notifications, unreadCount] = await Promise.all([
            Notification.find({ recipient: recipientId })
                .sort({ createdAt: -1 })
                .limit(limit)
                .select("type read createdAt actor post")
                .populate("actor", "name avatar")
                .populate("post", "content")
                .lean(),

            Notification.countDocuments({
                recipient: recipientId,
                read: false,
            }),
        ]);

        const mapped = notifications.map((n: any) => ({
            id: n._id.toString(),
            type: n.type,
            read: n.read ?? false,
            createdAt: n.createdAt,
            actor: {
                id: n.actor?._id?.toString() ?? "",
                name: n.actor?.name ?? "Someone",
                avatar: n.actor?.avatar ?? "",
            },
            post: n.post
                ? {
                    id: n.post._id?.toString() ?? "",
                    content: n.post.content ?? "",
                }
                : null,
        }));

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
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();

        if (body?.action === "mark-all-read") {
            await connectDB();

            // Skip the write entirely if there's nothing to update.
            // This is the most common case (user clicks the button
            // when they've already read everything).
            const result = await Notification.updateMany(
                {
                    recipient: new Types.ObjectId(me._id),
                    read: false,
                },
                { $set: { read: true } }
            );

            return NextResponse.json({
                ok: true,
                updated: result.modifiedCount,
            });
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