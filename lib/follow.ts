// lib/follow.ts
import { Types } from "mongoose";
import User from "@/models/user";
import Notification from "@/models/Notification";
import { revalidateTag } from "next/cache";
import { pusherServer } from "@/lib/pusher";

/* ============================================================
   Follow / Unfollow
   ============================================================ */

export async function toggleFollow(meId: string, targetId: string) {
    const meObjectId = new Types.ObjectId(meId);
    const targetObjectId = new Types.ObjectId(targetId);

    const target = await User.findById(targetObjectId);
    if (!target) throw new Error("User not found");

    if (meId === targetId) throw new Error("You cannot follow yourself");

    const isFollowing = target.followers.some(
        (uid: Types.ObjectId) => uid.toString() === meId
    );

    if (isFollowing) {
        // Unfollow
        target.followers = target.followers.filter(
            (uid: Types.ObjectId) => uid.toString() !== meId
        );
        await User.updateOne(
            { _id: meObjectId },
            { $pull: { following: targetObjectId } }
        );
    } else {
        // Follow
        target.followers.push(meObjectId);
        await User.updateOne(
            { _id: meObjectId },
            { $addToSet: { following: targetObjectId } }
        );

        // Notify the target only on new follows (not unfollows)
        const notification = await Notification.create({
            recipient: targetObjectId,
            actor: meObjectId,
            type: "follow",
        });

        // ─── Tell the target via Pusher ───
        try {
            const actor = await User.findById(meObjectId)
                .select("name email avatar")
                .lean();

            await pusherServer.trigger(
                `private-user-${targetId}`,
                "notification:new",
                {
                    id: notification._id.toString(),
                    type: "follow",
                    read: false,
                    createdAt: notification.createdAt,
                    actor: {
                        id: meId,
                        name: (actor as any)?.name ?? "Someone",
                        email: (actor as any)?.email ?? "",
                        avatar: (actor as any)?.avatar ?? "",
                    },
                    post: null,
                }
            );
            console.log("✅ notification:new (follow) fired to", targetId);
        } catch (pusherErr) {
            console.error("❌ Pusher follow trigger failed:", pusherErr);
        }

        revalidateTag("notifications", "max");
    }

    await target.save();

    return {
        following: !isFollowing,
        followersCount: target.followers.length,
    };
}

/* ============================================================
   ID-only queries — for filtering lists
   ============================================================ */

/**
 * Returns the IDs of users that `userId` is following.
 */
export async function getFollowingIds(userId: string): Promise<string[]> {
    if (!Types.ObjectId.isValid(userId)) return [];
    const user = await User.findById(userId).select("following").lean();
    if (!user) return [];
    return ((user as any).following ?? []).map((id: any) => id.toString());
}

/**
 * Returns the IDs of users who follow `userId`.
 */
export async function getFollowerIds(userId: string): Promise<string[]> {
    if (!Types.ObjectId.isValid(userId)) return [];
    const user = await User.findById(userId).select("followers").lean();
    if (!user) return [];
    return ((user as any).followers ?? []).map((id: any) => id.toString());
}

/* ============================================================
   Full-user queries — for the followers/following pages
   ============================================================ */

/**
 * Returns full user objects that `userId` is following.
 */
export async function getFollowingUsers(userId: string) {
    if (!Types.ObjectId.isValid(userId)) return [];
    const user = await User.findById(userId)
        .populate(
            "following",
            "name email avatar bio followers following"
        )
        .lean();
    if (!user) return [];
    return (user as any).following ?? [];
}

/**
 * Returns full user objects who follow `userId`.
 */
export async function getFollowerUsers(userId: string) {
    if (!Types.ObjectId.isValid(userId)) return [];
    const user = await User.findById(userId)
        .populate(
            "followers",
            "name email avatar bio followers following"
        )
        .lean();
    if (!user) return [];
    return (user as any).followers ?? [];
}