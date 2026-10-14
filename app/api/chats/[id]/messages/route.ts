// app/api/chats/[id]/messages/route.ts
import { NextResponse } from "next/server";
import { Types } from "mongoose";
import connectDB from "@/lib/mongo";
import Chat from "@/models/Chat";
import Message from "@/models/Message";
import { getCurrentUser } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";

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
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;

        if (!Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { message: "Invalid chat id" },
                { status: 400 }
            );
        }

        await connectDB();

        const userObjectId = new Types.ObjectId(user._id);
        const chatObjectId = new Types.ObjectId(id);

        const chat = await Chat.findOne({
            _id: chatObjectId,
            participants: userObjectId,
        })
            .select("_id")
            .lean();

        if (!chat) {
            return NextResponse.json(
                { message: "Chat not found" },
                { status: 404 }
            );
        }

        const [messages] = await Promise.all([
            Message.find({ chat: chatObjectId })
                .sort({ createdAt: 1 })
                .limit(100)
                .select("content createdAt sender readBy")
                .populate("sender", "name avatar")
                .lean(),

            Message.updateMany(
                { chat: chatObjectId, readBy: { $ne: userObjectId } },
                { $addToSet: { readBy: userObjectId } }
            ),
        ]);

        const userId = user._id;

        const mapped = messages.map((m: any) => ({
            id: m._id.toString(),
            content: m.content,
            createdAt: m.createdAt,
            isMine: m.sender?._id?.toString() === userId,
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
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;

        if (!Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { message: "Invalid chat id" },
                { status: 400 }
            );
        }

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

        const userObjectId = new Types.ObjectId(user._id);
        const chatObjectId = new Types.ObjectId(id);

        // Fetch the chat WITH participants so we can find the recipient
        const chat = await Chat.findOne({
            _id: chatObjectId,
            participants: userObjectId,
        })
            .select("_id participants")
            .lean();

        if (!chat) {
            return NextResponse.json(
                { message: "Chat not found" },
                { status: 404 }
            );
        }

        // Create the message
        const message = await Message.create({
            chat: chatObjectId,
            sender: userObjectId,
            content: content.trim(),
            readBy: [userObjectId],
        });

        // Bump the chat's updatedAt + lastMessage
        await Chat.updateOne(
            { _id: chatObjectId },
            {
                $set: {
                    lastMessage: message._id,
                    updatedAt: new Date(),
                },
            }
        );

        // Populate the sender for both the response and the Pusher payload
        const populated: any = await Message.findById(message._id)
            .populate("sender", "name avatar")
            .lean();

        // ─── Broadcast to the recipient via Pusher ───
        try {
            const recipientId = (chat.participants as any[])
                .map((p) => p.toString())
                .find((pid) => pid !== user._id);

            if (recipientId) {
                await pusherServer.trigger(
                    `private-user-${recipientId}`,
                    "message:new",
                    {
                        chatId: id,
                        message: {
                            id: populated._id.toString(),
                            content: populated.content,
                            createdAt: populated.createdAt,
                            isMine: false,
                            sender: {
                                id: populated.sender?._id?.toString(),
                                name: populated.sender?.name ?? "Unknown",
                                avatar: populated.sender?.avatar ?? "",
                            },
                        },
                    }
                );
            }
        } catch (pusherErr) {
            // Log but don't fail the request — the message is already saved
            console.error("Pusher trigger failed:", pusherErr);
        }

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