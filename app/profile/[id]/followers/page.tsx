// app/profile/[id]/followers/page.tsx
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

import connectDB from "@/lib/mongo";
import User from "@/models/user";
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

    const meFilter = payload.id
        ? { _id: payload.id }
        : payload.userId
            ? { _id: payload.userId }
            : { email: payload.email };

    const meObjectId = new Types.ObjectId(id);

    // Run all three reads in parallel:
    //  1. current user (need followers list)
    //  2. target user with populated followers
    //  3. (removed) — see below
    const [me, target] = await Promise.all([
        User.findOne(meFilter).select("following").lean(),

        User.findById(id)
            .select("followers")
            .populate({
                path: "followers",
                select: "name email avatar bio followers following",
                options: { limit: 200 },
            })
            .lean(),
    ]);

    if (!me) redirect("/login");
    if (!target) notFound();

    // Use the local Set instead of a separate getFollowingIds query
    const myFollowing = new Set(
        (me.following ?? []).map((fid: any) => fid.toString())
    );

    const meId = me._id.toString();

    const users = ((target as any).followers ?? []).map((u: any) => {
        const uid = u._id.toString();
        return {
            id: uid,
            name: u.name ?? "Unknown",
            email: u.email ?? "",
            avatar: u.avatar ?? "",
            bio: u.bio ?? "",
            followersCount: u.followers?.length ?? 0,
            followingCount: u.following?.length ?? 0,
            isFollowing: myFollowing.has(uid),
            isMe: uid === meId,
            followsMe: (u.followers ?? []).some(
                (f: any) => f.toString() === meId
            ),
        };
    });

    return (
        <FollowListClient
            title="Followers"
            backHref={`/profile/${id}`}
            initialUsers={JSON.parse(JSON.stringify(users))}
        />
    );
}