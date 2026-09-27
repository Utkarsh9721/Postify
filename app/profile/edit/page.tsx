// app/profile/edit/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongo";
import { User } from "@/lib/models";
import EditProfileForm from "./EditProfileForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
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

    return (
        <EditProfileForm
            initial={{
                id: me._id.toString(),
                name: me.name ?? "",
                bio: me.bio ?? "",
                email: me.email ?? "",
                avatar: me.avatar ?? "",
            }}
        />
    );
}