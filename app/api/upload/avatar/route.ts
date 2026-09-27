// app/api/users/me/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import { User } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
    try {
        const me = await getCurrentUser();
        if (!me) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, bio, avatar } = body;

        const update: Record<string, any> = {};

        if (typeof name === "string") {
            if (!name.trim()) {
                return NextResponse.json(
                    { message: "Name cannot be empty" },
                    { status: 400 }
                );
            }
            if (name.length > 60) {
                return NextResponse.json(
                    { message: "Name too long (max 60 chars)" },
                    { status: 400 }
                );
            }
            update.name = name.trim();
        }

        if (typeof bio === "string") {
            if (bio.length > 200) {
                return NextResponse.json(
                    { message: "Bio too long (max 200 chars)" },
                    { status: 400 }
                );
            }
            update.bio = bio.trim();
        }

        if (typeof avatar === "string") {
            if (avatar.length > 500) {
                return NextResponse.json(
                    { message: "Invalid avatar URL" },
                    { status: 400 }
                );
            }
            update.avatar = avatar;
        }

        if (Object.keys(update).length === 0) {
            return NextResponse.json(
                { message: "Nothing to update" },
                { status: 400 }
            );
        }

        await connectDB();

        await User.updateOne({ _id: me._id }, { $set: update });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("PATCH /api/users/me error:", err);
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}