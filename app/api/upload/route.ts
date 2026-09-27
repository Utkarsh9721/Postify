// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = "ya6x1upb"; // ← changed from "socially_unsigned"

export async function POST(req: Request) {
    try {
        const me = await getCurrentUser();
        if (!me) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ message: "No file provided" }, { status: 400 });
        }

        if (!ALLOWED.includes(file.type)) {
            return NextResponse.json(
                { message: "Only JPEG, PNG, WebP, or GIF allowed" },
                { status: 400 }
            );
        }

        if (file.size > MAX_BYTES) {
            return NextResponse.json(
                { message: "File too large (max 5 MB)" },
                { status: 400 }
            );
        }

        const cloudForm = new FormData();
        cloudForm.append("file", file);
        cloudForm.append("upload_preset", UPLOAD_PRESET);
        cloudForm.append("folder", "socially/posts");

        const cloudRes = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: cloudForm,
            }
        );

        const cloudData: any = await cloudRes.json();

        if (!cloudRes.ok) {
            console.error("Cloudinary upload failed:", cloudData);
            return NextResponse.json(
                { message: cloudData?.error?.message || "Upload failed" },
                { status: cloudRes.status }
            );
        }

        return NextResponse.json({
            url: cloudData.secure_url,
            publicId: cloudData.public_id,
            width: cloudData.width,
            height: cloudData.height,
        });
    } catch (err: any) {
        console.error("POST /api/upload error:", err);
        return NextResponse.json(
            { message: err?.message || "Upload failed" },
            { status: 500 }
        );
    }
}