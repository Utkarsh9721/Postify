import { NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import { Call } from "@/lib/models";
import { pusherServer } from "@/lib/pusher";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!["accepted", "declined", "ended"].includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    await connectDB();
    const call = await Call.findByIdAndUpdate(id, { status }, { new: true });
    if (!call) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    // Tell the caller when the recipient declines
    if (status === "declined" || status === "ended") {
      await pusherServer.trigger(
        `private-user-${call.caller}`,
        "call:end",
        { callId: id, status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Call update error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
