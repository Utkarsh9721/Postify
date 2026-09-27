// models/User.ts
import mongoose, { Schema, models, Types } from "mongoose";

export interface IUser {
    _id: Types.ObjectId;
    name: string;
    email: string;
    password: string;
    bio?: string;
    avatar?: string;
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
            required: true,
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