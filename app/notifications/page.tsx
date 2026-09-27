// app/notifications/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/mongo";
import { User, Notification } from "@/lib/models";
import NotificationsClient from "./NotificationsClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const currentUser = await User.findOne(
        payload.id
            ? { _id: payload.id }
            : payload.userId
                ? { _id: payload.userId }
                : { email: payload.email }
    )
        .select("-password")
        .lean();

    if (!currentUser) redirect("/login");

    const userId = currentUser._id.toString();

    const notifications = await Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("actor", "name email avatar")
        .populate("post", "content")
        .lean();

    const initialNotifications = notifications.map((n: any) => ({
        id: n._id.toString(),
        type: n.type,
        read: n.read ?? false,
        createdAt: n.createdAt,
        actor: {
            id: n.actor?._id?.toString() ?? "",
            name: n.actor?.name ?? "Someone",
            email: n.actor?.email ?? "",
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
            initialNotifications={JSON.parse(
                JSON.stringify(initialNotifications)
            )}
        />
    );
}