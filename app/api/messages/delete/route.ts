// app/api/messages/delete/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/mongo";
import { Message, Chat } from "@/lib/models";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = await request.json();
    if (!messageId) {
      return NextResponse.json(
        { message: "Missing messageId" },
        { status: 400 }
      );
    }

    await connectDB();

    const userId = payload.id ?? payload.userId ?? null;
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json(
        { message: "Message not found" },
        { status: 404 }
      );
    }

    // Only the sender can delete their own message
    if (message.sender.toString() !== userId.toString()) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await Message.findByIdAndDelete(messageId);

    // If the deleted message was the chat's lastMessage, update it
    const chat = await Chat.findOne({ lastMessage: message._id });
    if (chat) {
      const latest = await Message.findOne({ chat: chat._id })
        .sort({ createdAt: -1 })
        .select("_id");

      await Chat.findByIdAndUpdate(chat._id, {
        lastMessage: latest?._id ?? null,
      });
    }

    return NextResponse.json({ message: "Message deleted" });
  } catch (error) {
    console.error("Delete message error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
