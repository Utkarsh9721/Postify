// app/profile/[id]/followers/page.tsx
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

import connectDB from "@/lib/mongo";
import User from "@/models/user";
import { getFollowingIds } from "@/lib/follow";
import FollowListClient from "./FollowListClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function FollowersPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
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
        payload.id ? { _id: payload.id } : { email: payload.email }
    )
        .select("_id")
        .lean();

    if (!me) redirect("/login");

    const target: any = await User.findById(id)
        .populate("followers", "name email avatar bio followers following")
        .lean();

    if (!target) notFound();

    const myFollowing = await getFollowingIds(me._id.toString());

    const users = (target.followers ?? []).map((u: any) => ({
        id: u._id.toString(),
        name: u.name ?? "Unknown",
        email: u.email ?? "",
        avatar: u.avatar ?? "",
        bio: u.bio ?? "",
        followersCount: u.followers?.length ?? 0,
        followingCount: u.following?.length ?? 0,
        isFollowing: myFollowing.has(u._id.toString()),
        isMe: u._id.toString() === me._id.toString(),
        followsMe: (u.followers ?? []).some(
            (f: any) => f.toString() === me._id.toString()
        ),
    }));

    return (
        <FollowListClient
            title="Followers"
            backHref={`/profile/${id}`}
            initialUsers={JSON.parse(JSON.stringify(users))}
        />
    );
}