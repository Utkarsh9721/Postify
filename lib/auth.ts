// lib/auth.ts
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongo";
import User from "@/models/user";

export type AuthUser = {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return null;

    let payload: any;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
        return null;
    }

    await connectDB();

    const user = await User.findOne(
        payload.id ? { _id: payload.id } : { email: payload.email }
    )
        .select("-password")
        .lean();

    if (!user) return null;

    return {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
    };
}