// app/api/posts/[id]/like/route.ts
import { NextResponse } from "next/server";
import { Types } from "mongoose";
import connectDB from "@/lib/mongo";
import Post from "@/models/Post";
import Notification from "@/models/Notification";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
        await connectDB();

        const post = await Post.findById(id);
        if (!post) {
            return NextResponse.json({ message: "Post not found" }, { status: 404 });
        }

        // ✅ Explicit types fix the "uid" errors
        const alreadyLiked = post.likes.some(
            (uid: Types.ObjectId) => uid.toString() === user._id
        );

        if (alreadyLiked) {
            post.likes = post.likes.filter(
                (uid: Types.ObjectId) => uid.toString() !== user._id
            );
        } else {
            post.likes.push(new Types.ObjectId(user._id));

            if (post.author.toString() !== user._id) {
                await Notification.create({
                    recipient: post.author,
                    actor: user._id,
                    type: "like",
                    post: post._id,
                });
            }
        }

        await post.save();

        return NextResponse.json({
            liked: !alreadyLiked,
            likesCount: post.likes.length,
        });
    } catch (err) {
        console.error("POST /api/posts/[id]/like error:", err);
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}