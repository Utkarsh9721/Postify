// app/api/notifications/[id]/route.ts
import { NextResponse } from "next/server";
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
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        await connectDB();

        const notif = await Notification.findById(id);
        if (!notif) {
            return NextResponse.json(
                { message: "Notification not found" },
                { status: 404 }
            );
        }

        if (notif.recipient.toString() !== me._id) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        notif.read = true;
        await notif.save();

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
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        await connectDB();

        const notif = await Notification.findById(id);
        if (!notif) {
            return NextResponse.json(
                { message: "Notification not found" },
                { status: 404 }
            );
        }

        if (notif.recipient.toString() !== me._id) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        await Notification.findByIdAndDelete(id);

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("DELETE /api/notifications/[id] error:", err);
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}