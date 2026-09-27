// app/api/posts/[id]/comments/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import Post from "@/models/Post";
import Notification from "@/models/Notification";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
            .populate("comments.user", "name email avatar")
            .lean();

        if (!post) {
            return NextResponse.json({ message: "Post not found" }, { status: 404 });
        }

        const comments = (post.comments ?? []).map((c: any) => ({
            id: c._id.toString(),
            content: c.content,
            createdAt: c.createdAt,
            user: {
                id: c.user?._id?.toString(),
                name: c.user?.name ?? "Unknown",
                avatar: c.user?.avatar ?? "",
            },
        }));

        return NextResponse.json({ comments });
    } catch (err) {
        console.error("GET comments error:", err);
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { content } = await req.json();

        if (!content || !content.trim()) {
            return NextResponse.json(
                { message: "Comment cannot be empty" },
                { status: 400 }
            );
        }

        if (content.length > 500) {
            return NextResponse.json(
                { message: "Comment too long (max 500 chars)" },
                { status: 400 }
            );
        }

        await connectDB();

        const post = await Post.findById(id);
        if (!post) {
            return NextResponse.json({ message: "Post not found" }, { status: 404 });
        }

        post.comments.push({
            user: user._id as any,
            content: content.trim(),
            createdAt: new Date(),
        } as any);

        await post.save();

        if (post.author.toString() !== user._id) {
            await Notification.create({
                recipient: post.author,
                actor: user._id,
                type: "comment",
                post: post._id,
            });
        }

        const last = post.comments[post.comments.length - 1];

        const saved: any = await Post.findById(id)
            .populate("comments.user", "name email avatar")
            .lean();

        const populated: any = saved.comments.find(
            (c: any) => c._id.toString() === last._id.toString()
        );

        return NextResponse.json(
            {
                comment: {
                    id: populated._id.toString(),
                    content: populated.content,
                    createdAt: populated.createdAt,
                    user: {
                        id: populated.user?._id?.toString(),
                        name: populated.user?.name ?? "Unknown",
                        avatar: populated.user?.avatar ?? "",
                    },
                },
                commentsCount: post.comments.length,
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("POST comment error:", err);
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}