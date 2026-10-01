// app/profile/[id]/page.tsx
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

import connectDB from "@/lib/mongo";
import { User, Post } from "@/lib/models";
import ProfileClient from "./ProfileClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ProfilePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    /* Guard against non-ObjectId ids (e.g. "edit", "followers") */
    if (!Types.ObjectId.isValid(id)) notFound();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) redirect("/login");

    let payload: any;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
        redirect("/login");
    }

    await connectDB();

    const meFilter = payload.id
        ? { _id: payload.id }
        : payload.userId
            ? { _id: payload.userId }
            : { email: payload.email };

    const targetObjectId = new Types.ObjectId(id);

    // Parallel: fetch current user (with following+followers) and target user
    const [me, user] = await Promise.all([
        User.findOne(meFilter).select("following followers").lean(),
        User.findById(targetObjectId)
            .select(
                "name email avatar bio followers following createdAt"
            )
            .lean(),
    ]);

    if (!me) redirect("/login");
    if (!user) notFound();

    const userIdStr = me._id.toString();
    const userIsMe = (user as any)._id.toString() === userIdStr;

    // Build sets locally — no extra DB round trips
    const myFollowing = new Set(
        (me.following ?? []).map((fid: any) => fid.toString())
    );
    const myFollowers = new Set(
        (me.followers ?? []).map((fid: any) => fid.toString())
    );

    // Fetch posts and count in parallel — no need for the follow helpers
    const [posts, postCount] = await Promise.all([
        Post.find({ author: targetObjectId })
            .sort({ createdAt: -1 })
            .limit(20)
            .select("content likes comments createdAt")
            .lean(),
        Post.countDocuments({ author: targetObjectId }),
    ]);

    const profile = {
        id: (user as any)._id.toString(),
        name: (user as any).name ?? "Unknown",
        email: (user as any).email ?? "",
        avatar: (user as any).avatar ?? "",
        bio: (user as any).bio ?? "",
        followersCount: (user as any).followers?.length ?? 0,
        followingCount: (user as any).following?.length ?? 0,
        postsCount: postCount,
        joinedAt: (user as any).createdAt
            ? new Date((user as any).createdAt).toISOString()
            : "",
        isMe: userIsMe,
        isFollowing: myFollowing.has((user as any)._id.toString()),
        followsMe: myFollowers.has((user as any)._id.toString()),
    };

    const mappedPosts = posts.map((p: any) => ({
        id: p._id.toString(),
        content: p.content,
        createdAt: p.createdAt,
        likesCount: p.likes?.length ?? 0,
        commentsCount: p.comments?.length ?? 0,
    }));

    return (
        <ProfileClient
            profile={JSON.parse(JSON.stringify(profile))}
            posts={JSON.parse(JSON.stringify(mappedPosts))}
        />
    );
}