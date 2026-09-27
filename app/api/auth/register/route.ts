import { NextResponse } from "next/server";
import User from "@/models/user";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongo";

export async function POST(request: Request) {
    try {
        const { name, email, password } = await request.json();

        // Check all fields
        if (!name || !email || !password) {
            return NextResponse.json(
                { message: "All fields are required" },
                { status: 400 }
            );
        }

        // Connect to MongoDB
        await connectDB();

        // Check whether user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return NextResponse.json(
                { message: "Email already exists" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new User({
            name,
            email,
            password: hashedPassword,
        });

        // Save user
        await user.save();

        return NextResponse.json(
            { message: "Registration successful" },
            { status: 201 }
        );

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}