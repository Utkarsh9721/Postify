// models/User.ts
import mongoose, { Schema, models, Types } from "mongoose";

export interface IUser {
    _id: Types.ObjectId;
    name: string;
    email: string;
    password?: string;         // ← optional now (Google users have no password)
    bio?: string;
    avatar?: string;
    provider?: "credentials" | "google";  // ← new: distinguishes auth method
    followers: Types.ObjectId[];
    following: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: false,        // ← FIX: was `true`
        },

        bio: {
            type: String,
            default: "",
            maxlength: 200,
        },

        avatar: {
            type: String,
            default: "",
        },

        // Which auth method created this account
        provider: {
            type: String,
            enum: ["credentials", "google"],
            default: "credentials",
        },

        // Social graph
        followers: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        following: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    {
        timestamps: true,
    }
);

const User = models.User || mongoose.model<IUser>("User", UserSchema);

export default User;