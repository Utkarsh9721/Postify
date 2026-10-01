// app/api/upload/avatar/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB
const ALLOWED = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = "ya6x1upb";

export async function POST(req: Request) {
    try {
        const me = await getCurrentUser();
        if (!me) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { message: "No file provided" },
                { status: 400 }
            );
        }

        if (!ALLOWED.has(file.type)) {
            return NextResponse.json(
                { message: "Only JPEG, PNG, or WebP allowed" },
                { status: 400 }
            );
        }

        if (file.size > MAX_BYTES) {
            return NextResponse.json(
                { message: "File too large (max 3 MB)" },
                { status: 400 }
            );
        }

        // Reject empty files before we waste a network round trip
        if (file.size === 0) {
            return NextResponse.json(
                { message: "File is empty" },
                { status: 400 }
            );
        }

        const cloudForm = new FormData();
        cloudForm.append("file", file);
        cloudForm.append("upload_preset", UPLOAD_PRESET);
        cloudForm.append("folder", "socially/avatars");

        // Add a transformation to reduce the upload size and normalize output
        cloudForm.append(
            "transformation",
            "c_fill,g_face,w_400,h_400,q_auto:good,f_auto"
        );

        const cloudRes = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: cloudForm,
                // Fail fast if Cloudinary hangs
                signal: AbortSignal.timeout(15000),
            }
        );

        const cloudData: any = await cloudRes.json();

        if (!cloudRes.ok) {
            console.error("Cloudinary avatar upload failed:", {
                status: cloudRes.status,
                error: cloudData?.error,
            });
            return NextResponse.json(
                {
                    message:
                        cloudData?.error?.message || "Upload failed",
                },
                { status: cloudRes.status }
            );
        }

        return NextResponse.json({
            url: cloudData.secure_url,
            publicId: cloudData.public_id,
        });
    } catch (err: any) {
        // Timeout has a specific name
        if (err?.name === "TimeoutError") {
            return NextResponse.json(
                { message: "Upload timed out. Try again." },
                { status: 504 }
            );
        }

        console.error("POST /api/upload/avatar error:", err);
        return NextResponse.json(
            { message: err?.message || "Upload failed" },
            { status: 500 }
        );
    }
}