import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "@/models/user";
import connectDB from "@/lib/mongo";

export const runtime = "nodejs";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(request: Request) {
    try {
        const { credential } = await request.json();

        if (!credential) {
            return NextResponse.json(
                { message: "Missing credential" },
                { status: 400 }
            );
        }

        // 1. Verify the ID token with Google
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            return NextResponse.json({ message: "Invalid token" }, { status: 401 });
        }

        await connectDB();

        // 2. Find or create the user
        let user = await User.findOne({ email: payload.email });

        if (!user) {
            user = await User.create({
                email: payload.email,
                name: payload.name || "New User",
                image: payload.picture,
                provider: "google",
                // No password — OAuth user
            });
        }

        // 3. Issue our own JWT (same shape as your email/password route)
        const token = jwt.sign(
            { id: user._id.toString(), email: user.email },
            process.env.JWT_SECRET!,
            { expiresIn: "1d" }
        );

        const response = NextResponse.json({ message: "Login successful" });

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24,
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Google auth error:", error);
        return NextResponse.json(
            { message: "Google authentication failed" },
            { status: 500 }
        );
    }
}