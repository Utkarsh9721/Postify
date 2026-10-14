import mongoose, { Schema, models, Types } from "mongoose";

export interface ICall {
    _id: Types.ObjectId;
    caller: Types.ObjectId;
    recipient: Types.ObjectId;
    callType: "audio" | "video";
    room: string;
    status: "ringing" | "accepted" | "declined" | "ended";
    createdAt: Date;
    updatedAt: Date;
}

const CallSchema = new Schema<ICall>(
    {
        caller: { type: Schema.Types.ObjectId, ref: "User", required: true },
        recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
        callType: { type: String, enum: ["audio", "video"], required: true },
        room: { type: String, required: true },
        status: {
            type: String,
            enum: ["ringing", "accepted", "declined", "ended"],
            default: "ringing",
        },
    },
    { timestamps: true }
);

// Auto-cleanup: calls older than 60s that are still "ringing" are stale
CallSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 });

const Call = models.Call || mongoose.model<ICall>("Call", CallSchema);
export default Call;