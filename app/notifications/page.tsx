// app/notifications/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { unstable_cache } from "next/cache";

import connectDB from "@/lib/mongo";
import { User, Notification } from "@/lib/models";
import NotificationsClient from "./NotificationsClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
   Cached queries — reduce TTFB by skipping DB hits on repeat loads
   ============================================================ */

const getUserById = unstable_cache(
    async (id: string) =>
        User.findById(id).select("name email").lean(),
    ["user-by-id"],
    { revalidate: 60, tags: ["user"] }
);

const getUserByEmail = unstable_cache(
    async (email: string) =>
        User.findOne({ email }).select("name email").lean(),
    ["user-by-email"],
    { revalidate: 60, tags: ["user"] }
);

const getNotifications = unstable_cache(
    async (userIdStr: string) => {
        const userObjectId = new Types.ObjectId(userIdStr);
        return Notification.find({ recipient: userObjectId })
            .sort({ createdAt: -1 })
            .limit(50)
            .select("type read createdAt actor post")
            .populate("actor", "name avatar")
            .populate("post", "content")
            .lean();
    },
    ["notifications-by-user"],
    { revalidate: 30, tags: ["notifications"] }
);

/* ============================================================
   Page
   ============================================================ */

export default async function NotificationsPage() {
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

    /* --- Resolve current user (cached) --- */
    let currentUser: any = null;

    if (payload.id) {
        currentUser = await getUserById(String(payload.id));
    } else if (payload.userId) {
        currentUser = await getUserById(String(payload.userId));
    } else if (payload.email) {
        currentUser = await getUserByEmail(String(payload.email));
    }

    if (!currentUser) redirect("/login");

    const userId = currentUser._id.toString();

    /* --- Fetch notifications (cached) --- */
    const notifications = await getNotifications(userId);

    const initialNotifications = notifications.map((n: any) => ({
        id: n._id.toString(),
        type: n.type,
        read: n.read ?? false,
        createdAt: n.createdAt,
        actor: {
            id: n.actor?._id?.toString() ?? "",
            name: n.actor?.name ?? "Someone",
            avatar: n.actor?.avatar ?? "",
        },
        post: n.post
            ? {
                id: n.post._id?.toString() ?? "",
                content: n.post.content ?? "",
            }
            : null,
    }));

    return (
        <NotificationsClient
            initialNotifications={JSON.parse(JSON.stringify(initialNotifications))}
        />
    );
}