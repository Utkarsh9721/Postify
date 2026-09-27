// app/api/posts/[id]/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import Post from "@/models/Post";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
   GET /api/posts/:id
   ============================================================ */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        await connectDB();

        const post: any = await Post.findById(id)
            .populate("author", "name email avatar")
            .populate("comments.user", "name email avatar")
            .lean();

        if (!post) {
            return NextResponse.json({ message: "Post not found" }, { status: 404 });
        }

        const mapped = {
            id: post._id.toString(),
            content: post.content,
            image: post.image || "",
            createdAt: post.createdAt,
            author: {
                id: post.author?._id?.toString(),
                name: post.author?.name ?? "Unknown",
                email: post.author?.email ?? "",
                avatar: post.author?.avatar ?? "",
            },
            likesCount: post.likes?.length ?? 0,
            likedByMe:
                post.likes?.some((uid: any) => uid.toString() === user._id) ??
                false,
            commentsCount: post.comments?.length ?? 0,
            comments: (post.comments ?? []).map((c: any) => ({
                id: c._id.toString(),
                content: c.content,
                createdAt: c.createdAt,
                user: {
                    id: c.user?._id?.toString(),
                    name: c.user?.name ?? "Unknown",
                    avatar: c.user?.avatar ?? "",
                },
            })),
            sharesCount: post.sharesCount ?? 0,
        };

        return NextResponse.json({ post: mapped });
    } catch (err) {
        console.error("GET /api/posts/[id] error:", err);
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}

/* ============================================================
   DELETE /api/posts/:id
   Only the author can delete.
   ============================================================ */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        await connectDB();

        const post = await Post.findById(id);
        if (!post) {
            return NextResponse.json({ message: "Post not found" }, { status: 404 });
        }

        if (post.author.toString() !== user._id) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        await Post.findByIdAndDelete(id);

        return NextResponse.json({ message: "Post deleted" });
    } catch (err) {
        console.error("DELETE /api/posts/[id] error:", err);
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}