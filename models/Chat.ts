// models/Chat.ts
import mongoose, { Schema, models, Types } from "mongoose";

export interface IChat {
    _id: Types.ObjectId;
    participants: Types.ObjectId[];
    lastMessage?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
    {
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],

        // Convenience pointer to the newest message (for sidebar previews)
        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: "Message",
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate 1-on-1 chats and speed up "find my chats"
ChatSchema.index({ participants: 1 });

const Chat = models.Chat || mongoose.model<IChat>("Chat", ChatSchema);

export default Chat;