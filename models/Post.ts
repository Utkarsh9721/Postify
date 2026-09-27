// models/Post.ts
import mongoose, { Schema, models, Types } from "mongoose";

export interface IComment {
    _id: Types.ObjectId;
    user: Types.ObjectId;
    content: string;
    createdAt: Date;
}

export interface IPost {
    _id: Types.ObjectId;
    author: Types.ObjectId;
    content: string;
    image?: string;
    likes: Types.ObjectId[];
    comments: IComment[];
    sharesCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: true,
            maxlength: 500,
        },
    },
    { timestamps: true }
);

const PostSchema = new Schema<IPost>(
    {
        author: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        content: {
            type: String,
            required: true,
            maxlength: 2000,
        },

        image: {
            type: String,
            default: "",
        },

        likes: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        comments: [CommentSchema],

        sharesCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Feed query speed: newest first
PostSchema.index({ createdAt: -1 });

const Post = models.Post || mongoose.model<IPost>("Post", PostSchema);

export default Post;