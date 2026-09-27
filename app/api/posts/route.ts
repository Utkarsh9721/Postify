// app/api/posts/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongo";
import { Post } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const me = await getCurrentUser();
        if (!me) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(
            50,
            Math.max(1, parseInt(searchParams.get("limit") || "10", 10))
        );
        const skip = (page - 1) * limit;

        const [posts, total] = await Promise.all([
            Post.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("author", "name email avatar")
                .populate("comments.user", "name email avatar")
                .lean(),
            Post.countDocuments(),
        ]);

        const mapped = posts.map((p: any) => ({
            id: p._id.toString(),
            content: p.content,
            image: p.image || "",
            createdAt: p.createdAt,
            author: {
                id: p.author?._id?.toString(),
                name: p.author?.name ?? "Unknown",
                email: p.author?.email ?? "",
                avatar: p.author?.avatar ?? "",
            },
            likesCount: p.likes?.length ?? 0,
            likedByMe:
                p.likes?.some((id: any) => id.toString() === me._id) ?? false,
            commentsCount: p.comments?.length ?? 0,
            comments: (p.comments ?? []).map((c: any) => ({
                id: c._id.toString(),
                content: c.content,
                createdAt: c.createdAt,
                user: {
                    id: c.user?._id?.toString(),
                    name: c.user?.name ?? "Unknown",
                    avatar: c.user?.avatar ?? "",
                },
            })),
            sharesCount: p.sharesCount ?? 0,
        }));

        return NextResponse.json({
            posts: mapped,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
                hasMore: skip + posts.length < total,
            },
        });
    } catch (err) {
        console.error("GET /api/posts error:", err);
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const me = await getCurrentUser();
        if (!me) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { content, image, imagePublicId } = await req.json();

        if (!content || !content.trim()) {
            return NextResponse.json(
                { message: "Content is required" },
                { status: 400 }
            );
        }

        if (content.length > 2000) {
            return NextResponse.json(
                { message: "Content is too long (max 2000 chars)" },
                { status: 400 }
            );
        }

        await connectDB();

        const post = await Post.create({
            author: me._id,
            content: content.trim(),
            image: image || "",
            imagePublicId: imagePublicId || "",
        });

        const populated: any = await Post.findById(post._id)
            .populate("author", "name email avatar")
            .lean();

        return NextResponse.json(
            {
                post: {
                    id: populated._id.toString(),
                    content: populated.content,
                    image: populated.image || "",
                    createdAt: populated.createdAt,
                    author: {
                        id: populated.author?._id?.toString(),
                        name: populated.author?.name ?? "Unknown",
                        email: populated.author?.email ?? "",
                        avatar: populated.author?.avatar ?? "",
                    },
                    likesCount: 0,
                    likedByMe: false,
                    commentsCount: 0,
                    comments: [],
                    sharesCount: 0,
                },
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("POST /api/posts error:", err);
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}