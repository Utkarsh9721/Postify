// app/api/posts/[id]/like/route.ts
import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { revalidateTag } from "next/cache";
import connectDB from "@/lib/mongo";
import Post from "@/models/Post";
import Notification from "@/models/Notification";
import User from "@/models/user";
import { getCurrentUser } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";

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
                const notification = await Notification.create({
                    recipient: post.author,
                    actor: user._id,
                    type: "like",
                    post: post._id,
                });

                // ─── Notify the post author via Pusher ───
                try {
                    const actor = await User.findById(user._id)
                        .select("name avatar")
                        .lean();

                    await pusherServer.trigger(
                        `private-user-${post.author}`,
                        "notification:new",
                        {
                            id: notification._id.toString(),
                            type: "like",
                            read: false,
                            createdAt: notification.createdAt,
                            actor: {
                                id: user._id,
                                name: (actor as any)?.name ?? "Someone",
                                email: user.email ?? "",
                                avatar: (actor as any)?.avatar ?? "",
                            },
                            post: {
                                id: post._id.toString(),
                                content: post.content?.slice(0, 120) ?? "",
                            },
                        }
                    );
                    console.log("✅ notification:new (like) fired to", post.author);
                } catch (pusherErr) {
                    console.error("❌ Pusher like trigger failed:", pusherErr);
                }

                revalidateTag("notifications", "max");
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