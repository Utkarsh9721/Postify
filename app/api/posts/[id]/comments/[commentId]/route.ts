// app/api/posts/[id]/comments/[commentId]/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import Post from "@/models/Post";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; commentId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id, commentId } = await params;
        await connectDB();

        const post = await Post.findById(id);
        if (!post) {
            return NextResponse.json({ message: "Post not found" }, { status: 404 });
        }

        const comment: any = (post.comments as any).id(commentId);
        if (!comment) {
            return NextResponse.json({ message: "Comment not found" }, { status: 404 });
        }

        const isCommentAuthor = comment.user.toString() === user._id;
        const isPostAuthor = post.author.toString() === user._id;

        if (!isCommentAuthor && !isPostAuthor) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        (post.comments as any).pull(commentId);
        await post.save();

        return NextResponse.json({
            message: "Comment deleted",
            commentsCount: post.comments.length,
        });
    } catch (err) {
        console.error("DELETE comment error:", err);
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}