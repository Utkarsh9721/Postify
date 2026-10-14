// app/dashboard/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { PusherProvider } from "@/lib/PusherProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) redirect("/login");

    let payload: any;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
        redirect("/login");
    }

    const userId = String(payload.id ?? payload.userId ?? "");
    if (!userId) redirect("/login");

    return <PusherProvider userId={userId}>{children}</PusherProvider>;
}