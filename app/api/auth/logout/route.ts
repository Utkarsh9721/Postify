import { NextResponse } from "next/server";

export async function POST() {
    try {
        const response = NextResponse.json({
            message: "Logout successful",
        });

        response.cookies.delete("token");

        return response;

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { message: "Logout failed" },
            { status: 500 }
        );
    }
}