// app/api/notifications/[id]/route.ts
import { NextResponse } from "next/server";
import { Types } from "mongoose";
import connectDB from "@/lib/mongo";
import { Notification } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
   PATCH /api/notifications/:id
   Marks a single notification as read.
   ============================================================ */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const me = await getCurrentUser();
        if (!me) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;

        // Guard against malformed IDs — CastError would otherwise be a 500
        if (!Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { message: "Invalid notification id" },
                { status: 400 }
            );
        }

        await connectDB();

        // Single query: find AND update, but only if the current user owns it.
        // Everything (existence check + ownership + update) collapses into
        // one atomic write.
        const result = await Notification.updateOne(
            {
                _id: new Types.ObjectId(id),
                recipient: new Types.ObjectId(me._id),
            },
            { $set: { read: true } }
        );

        if (result.matchedCount === 0) {
            // Either the notification doesn't exist, or it isn't ours.
            // Returning 404 for both avoids leaking which is true.
            return NextResponse.json(
                { message: "Notification not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("PATCH /api/notifications/[id] error:", err);
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}

/* ============================================================
   DELETE /api/notifications/:id
   Removes a single notification.
   ============================================================ */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const me = await getCurrentUser();
        if (!me) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;

        if (!Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { message: "Invalid notification id" },
                { status: 400 }
            );
        }

        await connectDB();

        // Same trick: find + delete in one query, filtered by ownership.
        const result = await Notification.deleteOne({
            _id: new Types.ObjectId(id),
            recipient: new Types.ObjectId(me._id),
        });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { message: "Notification not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("DELETE /api/notifications/[id] error:", err);
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}