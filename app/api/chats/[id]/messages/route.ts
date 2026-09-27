// app/api/chats/[id]/messages/route.ts
import { NextResponse } from "next/server";
import { Types } from "mongoose";
import connectDB from "@/lib/mongo";
import Chat from "@/models/Chat";
import Message from "@/models/Message";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
   GET /api/chats/:id/messages
   ============================================================ */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        await connectDB();

        const chat = await Chat.findById(id);
        if (!chat) {
            return NextResponse.json({ message: "Chat not found" }, { status: 404 });
        }

        // ✅ Type the callback param explicitly
        const isParticipant = chat.participants.some(
            (p: Types.ObjectId) => p.toString() === user._id
        );

        if (!isParticipant) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const messages = await Message.find({ chat: id })
            .sort({ createdAt: 1 })
            .limit(100)
            .populate("sender", "name email avatar")
            .lean();

        // ✅ Cast user._id to ObjectId for updateMany
        await Message.updateMany(
            { chat: id, readBy: { $ne: new Types.ObjectId(user._id) } },
            { $addToSet: { readBy: new Types.ObjectId(user._id) } }
        );

        const mapped = messages.map((m: any) => ({
            id: m._id.toString(),
            content: m.content,
            createdAt: m.createdAt,
            isMine: m.sender?._id?.toString() === user._id,
            sender: {
                id: m.sender?._id?.toString(),
                name: m.sender?.name ?? "Unknown",
                avatar: m.sender?.avatar ?? "",
            },
        }));

        return NextResponse.json({ messages: mapped });
    } catch (err) {
        console.error("GET /api/chats/[id]/messages error:", err);
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}

/* ============================================================
   POST /api/chats/:id/messages
   ============================================================ */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { content } = await req.json();

        if (!content || !content.trim()) {
            return NextResponse.json(
                { message: "Message cannot be empty" },
                { status: 400 }
            );
        }

        if (content.length > 2000) {
            return NextResponse.json(
                { message: "Message too long (max 2000 chars)" },
                { status: 400 }
            );
        }

        await connectDB();

        const chat = await Chat.findById(id);
        if (!chat) {
            return NextResponse.json({ message: "Chat not found" }, { status: 404 });
        }

        // ✅ Type the callback param
        const isParticipant = chat.participants.some(
            (p: Types.ObjectId) => p.toString() === user._id
        );

        if (!isParticipant) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // ✅ Cast to ObjectId
        const message = await Message.create({
            chat: new Types.ObjectId(id),
            sender: new Types.ObjectId(user._id),
            content: content.trim(),
            readBy: [new Types.ObjectId(user._id)],
        });

        chat.lastMessage = message._id as any;
        chat.updatedAt = new Date();
        await chat.save();

        const populated: any = await Message.findById(message._id)
            .populate("sender", "name email avatar")
            .lean();

        return NextResponse.json(
            {
                message: {
                    id: populated._id.toString(),
                    content: populated.content,
                    createdAt: populated.createdAt,
                    isMine: true,
                    sender: {
                        id: populated.sender?._id?.toString(),
                        name: populated.sender?.name ?? "Unknown",
                        avatar: populated.sender?.avatar ?? "",
                    },
                },
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("POST /api/chats/[id]/messages error:", err);
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}