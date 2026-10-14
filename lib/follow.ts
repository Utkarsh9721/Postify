// lib/follow.ts
import { Types } from "mongoose";
import User from "@/models/user";
import Notification from "@/models/Notification";
import { revalidateTag } from "next/cache";
import { pusherServer } from "@/lib/pusher";

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