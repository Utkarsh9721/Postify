// app/api/users/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import User from "@/models/user";
import { getCurrentUser } from "@/lib/auth";
import { getFollowingIds, getFollowerIds } from "@/lib/follow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const me = await getCurrentUser();
        if (!me) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const q = (searchParams.get("q") || "").trim();
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(
            100,
            Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
        );
        const skip = (page - 1) * limit;

        const filter: any = { _id: { $ne: me._id } };
        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: "i" } },
                { email: { $regex: q, $options: "i" } },
            ];
        }

        const [users, total, myFollowing, myFollowers] = await Promise.all([
            User.find(filter)
                .select("name email avatar bio followers following")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(filter),
            getFollowingIds(me._id),
            getFollowerIds(me._id),
        ]);

        const mapped = users.map((u: any) => {
            const uid = u._id.toString();
            return {
                id: uid,
                name: u.name ?? "Unknown",
                email: u.email ?? "",
                avatar: u.avatar ?? "",
                bio: u.bio ?? "",
                followersCount: u.followers?.length ?? 0,
                followingCount: u.following?.length ?? 0,
                isFollowing: myFollowing.has(uid),
                followsMe: myFollowers.has(uid),
                isMe: uid === me._id,
            };
        });

        return NextResponse.json({
            users: mapped,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
                hasMore: skip + users.length < total,
            },
        });
    } catch (err) {
        console.error("GET /api/users error:", err);
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}