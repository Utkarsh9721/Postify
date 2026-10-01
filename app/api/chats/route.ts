// app/api/chats/route.ts
import { NextResponse } from "next/server";
import { Types } from "mongoose";
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
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectDB();

        const userObjectId = new Types.ObjectId(user._id);

        const chats = await Chat.find({ participants: userObjectId })
            .sort({ updatedAt: -1 })
            .limit(50)
            .select("participants lastMessage updatedAt")
            .populate("participants", "name email avatar")
            .populate({
                path: "lastMessage",
                select: "content sender createdAt",
                populate: { path: "sender", select: "name" },
            })
            .lean();

        const userId = user._id;

        const mapped = chats.map((c: any) => {
            const other = c.participants.find(
                (p: any) => p._id.toString() !== userId
            );
            const last = c.lastMessage;
            const isMine = last?.sender?._id?.toString() === userId;

            return {
                id: c._id.toString(),
                other: {
                    id: other?._id?.toString() ?? "",
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
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json(
                { message: "userId is required" },
                { status: 400 }
            );
        }

        if (!Types.ObjectId.isValid(userId)) {
            return NextResponse.json(
                { message: "Invalid userId" },
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

        const userObjectId = new Types.ObjectId(user._id);
        const otherObjectId = new Types.ObjectId(userId);

        // Run user lookup and existing chat lookup in parallel
        const [otherUser, existingChat] = await Promise.all([
            User.findById(otherObjectId)
                .select("name email avatar")
                .lean(),

            Chat.findOne({
                participants: { $all: [userObjectId, otherObjectId], $size: 2 },
            })
                .select("_id")
                .lean(),
        ]);

        if (!otherUser) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        let chatId = existingChat?._id;

        // Only create if it doesn't exist
        if (!chatId) {
            const created = await Chat.create({
                participants: [userObjectId, otherObjectId],
            });
            chatId = created._id;
        }

        return NextResponse.json({
            chat: {
                id: chatId!.toString(),
                other: {
                    id: (otherUser as any)._id.toString(),
                    name: (otherUser as any).name,
                    email: (otherUser as any).email,
                    avatar: (otherUser as any).avatar,
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