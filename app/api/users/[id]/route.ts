// app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import User from "@/models/user";
import Post from "@/models/Post";
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

        const user: any = await User.findById(id)
            .select("name email avatar bio followers following createdAt")
            .lean();

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const [myFollowing, posts, postCount] = await Promise.all([
            getFollowingIds(me._id),
            Post.find({ author: id })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate("author", "name email avatar")
                .lean(),
            Post.countDocuments({ author: id }),
        ]);

        return NextResponse.json({
            user: {
                id: user._id.toString(),
                name: user.name ?? "Unknown",
                email: user.email ?? "",
                avatar: user.avatar ?? "",
                bio: user.bio ?? "",
                followersCount: user.followers?.length ?? 0,
                followingCount: user.following?.length ?? 0,
                postsCount: postCount,
                createdAt: user.createdAt,
                isMe: user._id.toString() === me._id,
                isFollowing: myFollowing.has(user._id.toString()),
            },
            posts: posts.map((p: any) => ({
                id: p._id.toString(),
                content: p.content,
                createdAt: p.createdAt,
                likesCount: p.likes?.length ?? 0,
                commentsCount: p.comments?.length ?? 0,
            })),
        });
    } catch (err) {
        console.error("GET /api/users/[id] error:", err);
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}