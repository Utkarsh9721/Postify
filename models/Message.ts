// models/Message.ts
import mongoose, { Schema, models, Types } from "mongoose";

export interface IMessage {
    _id: Types.ObjectId;
    chat: Types.ObjectId;
    sender: Types.ObjectId;
    content: string;
    readBy: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
    {
        chat: {
            type: Schema.Types.ObjectId,
            ref: "Chat",
            required: true,
            index: true,
        },

        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        content: {
            type: String,
            required: true,
            maxlength: 2000,
        },

        readBy: [
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

// Fast lookup for "messages in this chat, newest first"
MessageSchema.index({ chat: 1, createdAt: -1 });

const Message =
    models.Message || mongoose.model<IMessage>("Message", MessageSchema);

export default Message;