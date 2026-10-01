// lib/mongo.ts
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI!;

if (!MONGO_URI) {
    throw new Error("MONGO_URI not found in environment variables");
}

// Cache the connection globally so Next.js hot-reloads and serverless
// invocations reuse the same connection instead of opening new ones.
let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
    // If we already have a live connection, reuse it
    if (cached.conn) {
        return cached.conn;
    }

    // If a connection is already being established, wait for it
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10,          // cap per serverless instance
            minPoolSize: 1,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        };

        cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => {
            console.log("✅ MongoDB connected");
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        // Reset so the next call retries instead of using a broken promise
        cached.promise = null;
        console.error("❌ MongoDB connection failed:", e);
        throw e;
    }

    return cached.conn;
}

export default connectDB;