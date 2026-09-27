"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
    const router = useRouter();

    async function handleLogout() {
        const response = await fetch("/api/auth/logout", {
            method: "POST",
        });

        if (response.ok) {
            router.push("/login");
            router.refresh();
        }
    }

    return (
        <button onClick={handleLogout}>
            Logout
        </button>
    );
}