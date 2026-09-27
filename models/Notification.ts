// models/Notification.ts
import mongoose, { Schema, models, Types } from "mongoose";

export type NotificationType =
    | "like"
    | "comment"
    | "follow"
    | "mention"
    | "message";

export interface INotification {
    _id: Types.ObjectId;
    recipient: Types.ObjectId; // who receives it
    actor: Types.ObjectId; // who triggered it
    type: NotificationType;
    post?: Types.ObjectId;
    read: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        recipient: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        actor: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        type: {
            type: String,
            enum: ["like", "comment", "follow", "mention", "message"],
            required: true,
        },

        // Optional reference to the related post
        post: {
            type: Schema.Types.ObjectId,
            ref: "Post",
        },

        read: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Fast lookup for "my unread notifications"
NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const Notification =
    models.Notification ||
    mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;