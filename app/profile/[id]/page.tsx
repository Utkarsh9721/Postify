// app/profile/[id]/page.tsx
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

import connectDB from "@/lib/mongo";
import { User, Post } from "@/lib/models";
import { getFollowingIds, getFollowerIds } from "@/lib/follow";
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

    const me = await User.findOne(
        payload.id
            ? { _id: payload.id }
            : payload.userId
                ? { _id: payload.userId }
                : { email: payload.email }
    )
        .select("-password")
        .lean();

    if (!me) redirect("/login");

    const user: any = await User.findById(id)
        .select("name email avatar bio followers following createdAt")
        .lean();

    if (!user) notFound();

    const userIdStr = me._id.toString();

    const [myFollowing, myFollowers, posts, postCount] = await Promise.all([
        getFollowingIds(userIdStr),
        getFollowerIds(userIdStr),
        Post.find({ author: id })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate("author", "name email avatar")
            .lean(),
        Post.countDocuments({ author: id }),
    ]);

    const profile = {
        id: user._id.toString(),
        name: user.name ?? "Unknown",
        email: user.email ?? "",
        avatar: user.avatar ?? "",
        bio: user.bio ?? "",
        followersCount: user.followers?.length ?? 0,
        followingCount: user.following?.length ?? 0,
        postsCount: postCount,
        joinedAt: user.createdAt
            ? new Date(user.createdAt).toISOString()
            : "",
        isMe: user._id.toString() === userIdStr,
        isFollowing: myFollowing.has(user._id.toString()),
        followsMe: myFollowers.has(user._id.toString()),
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