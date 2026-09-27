// app/friends/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/mongo";
import User from "@/models/user";
import FriendsClient from "./FriendsClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function FriendsPage() {
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

    const meId = me._id.toString();

    const [users, meDoc] = await Promise.all([
        User.find({ _id: { $ne: me._id } })
            .select("name email avatar bio followers following")
            .sort({ createdAt: -1 })
            .limit(100)
            .lean(),
        User.findById(me._id).select("following followers").lean(),
    ]);

    const myFollowing = new Set(
        (meDoc?.following ?? []).map((id: any) => id.toString())
    );
    const myFollowers = new Set(
        (meDoc?.followers ?? []).map((id: any) => id.toString())
    );

    const initialUsers = users.map((u: any) => {
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
            followsMe: myFollowers.has(uid),
        };
    });

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40 pb-28 lg:pb-0">
            {/* ─── Ambient background orbs ─── */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
                <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-200/40 blur-[120px]" />
                <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-purple-200/30 blur-[140px]" />
                <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-pink-200/20 blur-[120px]" />
            </div>

            {/* ─── Content ─── */}
            <div className="relative z-10">
                <FriendsClient
                    me={{ id: meId, name: me.name, email: me.email }}
                    initialUsers={JSON.parse(JSON.stringify(initialUsers))}
                />
            </div>
        </div>
    );
}