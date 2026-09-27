// app/api/users/[id]/following/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";
import { getFollowingIds } from "@/lib/follow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
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

        const target: any = await User.findById(id)
            .populate("following", "name email avatar bio followers following")
            .lean();

        if (!target) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const myFollowing = await getFollowingIds(me._id);

        const users = (target.following ?? []).map((u: any) => ({
            id: u._id.toString(),
            name: u.name ?? "Unknown",
            email: u.email ?? "",
            avatar: u.avatar ?? "",
            bio: u.bio ?? "",
            followersCount: u.followers?.length ?? 0,
            followingCount: u.following?.length ?? 0,
            isFollowing: myFollowing.has(u._id.toString()),
            isMe: u._id.toString() === me._id,
        }));

        return NextResponse.json({ users });
    } catch (err) {
        console.error("GET following error:", err);
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}