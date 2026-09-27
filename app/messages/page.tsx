// app/messages/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/mongo";
import User from "@/models/user";
import Chat from "@/models/Chat";
import MessagesClient from "./MessagesClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MessagesPage({
    searchParams,
}: {
    searchParams: Promise<{ chat?: string }>;
}) {
    const { chat: initialChatId } = await searchParams;

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) redirect("/login");

    let payload: any;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
        redirect("/login");
    }

    await connectDB();

    const currentUser = await User.findOne(
        payload.id
            ? { _id: payload.id }
            : payload.userId
                ? { _id: payload.userId }
                : { email: payload.email }
    )
        .select("-password")
        .lean();

    if (!currentUser) redirect("/login");

    const userId = currentUser._id.toString();

    const chats = await Chat.find({ participants: userId })
        .sort({ updatedAt: -1 })
        .limit(50)
        .populate("participants", "name email avatar")
        .populate({
            path: "lastMessage",
            populate: { path: "sender", select: "name email" },
        })
        .lean();

    const initialChats = chats.map((c: any) => {
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

    return (
        <MessagesClient
            currentUser={{
                id: userId,
                name: currentUser.name,
                email: currentUser.email,
            }}
            initialChats={JSON.parse(JSON.stringify(initialChats))}
            initialChatId={initialChatId ?? null}
        />
    );
}