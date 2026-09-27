// app/profile/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";

import connectDB from "@/lib/mongo";
import { User } from "@/lib/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MyProfileRedirect() {
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
        .select("_id")
        .lean();

    if (!me) redirect("/login");

    redirect(`/profile/${me._id.toString()}`);
}