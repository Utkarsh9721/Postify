// app/api/users/[id]/follow/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import { getCurrentUser } from "@/lib/auth";
import { toggleFollow } from "@/lib/follow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const me = await getCurrentUser();
        if (!me) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        if (id === me._id) {
            return NextResponse.json(
                { message: "You cannot follow yourself" },
                { status: 400 }
            );
        }

        await connectDB();

        const result = await toggleFollow(me._id, id);
        return NextResponse.json(result);
    } catch (err: any) {
        console.error("POST /api/users/[id]/follow error:", err);

        if (err?.message === "User not found") {
            return NextResponse.json({ message: err.message }, { status: 404 });
        }
        if (err?.message === "You cannot follow yourself") {
            return NextResponse.json({ message: err.message }, { status: 400 });
        }
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}