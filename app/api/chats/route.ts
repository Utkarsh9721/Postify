// app/api/chats/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import Chat from "@/models/Chat";
import Message from "@/models/Message";
import User from "@/models/user";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
   GET /api/chats
   Returns all chats for the current user, newest first.
   ============================================================ */
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const chats = await Chat.find({ participants: user._id })
            .sort({ updatedAt: -1 })
            .populate("participants", "name email avatar")
            .populate({
                path: "lastMessage",
                populate: { path: "sender", select: "name email" },
            })
            .lean();

        const mapped = chats.map((c: any) => {
            const other = c.participants.find(
                (p: any) => p._id.toString() !== user._id
            );
            const last = c.lastMessage;
            const isMine = last?.sender?._id?.toString() === user._id;

            return {
                id: c._id.toString(),
                other: {
                    id: other?._id?.toString(),
                    name: other?.name ?? "Unknown",
                    email: other?.email ?? "",
                    avatar: other?.avatar ?? "",
                },
                lastMessage: last
                    ? {
                        content: last.content,
                        isMine,
                        createdAt: last.createdAt,
                    }
                    : null,
                updatedAt: c.updatedAt,
            };
        });

        return NextResponse.json({ chats: mapped });
    } catch (err) {
        console.error("GET /api/chats error:", err);
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}

/* ============================================================
   POST /api/chats
   Body: { userId: string }
   Finds an existing 1-on-1 chat or creates a new one.
   ============================================================ */
export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json(
                { message: "userId is required" },
                { status: 400 }
            );
        }

        if (userId === user._id) {
            return NextResponse.json(
                { message: "Cannot chat with yourself" },
                { status: 400 }
            );
        }

        await connectDB();

        const otherUser = await User.findById(userId).select("name email avatar");
        if (!otherUser) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Look for existing 1-on-1 chat
        let chat = await Chat.findOne({
            participants: { $all: [user._id, userId], $size: 2 },
        });

        if (!chat) {
            chat = await Chat.create({
                participants: [user._id, userId],
            });
        }

        return NextResponse.json({
            chat: {
                id: chat._id.toString(),
                other: {
                    id: otherUser._id.toString(),
                    name: otherUser.name,
                    email: otherUser.email,
                    avatar: otherUser.avatar,
                },
            },
        });
    } catch (err) {
        console.error("POST /api/chats error:", err);
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}