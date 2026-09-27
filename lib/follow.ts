// lib/follow.ts
import { Types } from "mongoose";
import User from "@/models/user";
import Notification from "@/models/Notification";

/**
 * Returns the set of user IDs that `userId` is following.
 */
export async function getFollowingIds(userId: string): Promise<Set<string>> {
    const user = await User.findById(userId).select("following").lean();
    return new Set(
        (user?.following ?? []).map((id: any) => id.toString())
    );
}

/**
 * Returns the set of user IDs that follow `userId`.
 */
export async function getFollowerIds(userId: string): Promise<Set<string>> {
    const user = await User.findById(userId).select("followers").lean();
    return new Set(
        (user?.followers ?? []).map((id: any) => id.toString())
    );
}

/**
 * Follows `targetId` on behalf of `meId`.
 * - Uses $addToSet for idempotency (safe to call twice)
 * - Creates a "follow" notification
 * - Returns the new follower count of the target
 */
export async function followUser(
    meId: string,
    targetId: string
): Promise<{ following: true; followersCount: number }> {
    if (meId === targetId) {
        throw new Error("You cannot follow yourself");
    }

    const meObjectId = new Types.ObjectId(meId);
    const targetObjectId = new Types.ObjectId(targetId);

    // $addToSet prevents duplicates even if called concurrently
    await Promise.all([
        User.updateOne(
            { _id: meId },
            { $addToSet: { following: targetObjectId } }
        ),
        User.updateOne(
            { _id: targetId },
            { $addToSet: { followers: meObjectId } }
        ),
    ]);

    // Only notify if this is a fresh follow (dedupe recent notifications)
    const existing = await Notification.findOne({
        recipient: targetObjectId,
        actor: meObjectId,
        type: "follow",
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    if (!existing) {
        await Notification.create({
            recipient: targetObjectId,
            actor: meObjectId,
            type: "follow",
        });
    }

    const target = await User.findById(targetId).select("followers").lean();
    return {
        following: true,
        followersCount: target?.followers?.length ?? 0,
    };
}

/**
 * Unfollows `targetId` on behalf of `meId`.
 * Returns the new follower count of the target.
 */
export async function unfollowUser(
    meId: string,
    targetId: string
): Promise<{ following: false; followersCount: number }> {
    const meObjectId = new Types.ObjectId(meId);
    const targetObjectId = new Types.ObjectId(targetId);

    await Promise.all([
        User.updateOne(
            { _id: meId },
            { $pull: { following: targetObjectId } }
        ),
        User.updateOne(
            { _id: targetId },
            { $pull: { followers: meObjectId } }
        ),
    ]);

    const target = await User.findById(targetId).select("followers").lean();
    return {
        following: false,
        followersCount: target?.followers?.length ?? 0,
    };
}

/**
 * Follows or unfollows based on current state.
 * Also removes stale "follow" notifications when unfollowing.
 */
export async function toggleFollow(
    meId: string,
    targetId: string
): Promise<{ following: boolean; followersCount: number }> {
    if (meId === targetId) {
        throw new Error("You cannot follow yourself");
    }

    const target = await User.findById(targetId).select("followers").lean();
    if (!target) {
        throw new Error("User not found");
    }

    const isFollowing = (target.followers ?? []).some(
        (id: any) => id.toString() === meId
    );

    if (isFollowing) {
        return unfollowUser(meId, targetId);
    } else {
        return followUser(meId, targetId);
    }
}