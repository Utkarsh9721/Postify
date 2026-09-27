import { error } from "console";
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI!;
if (!MONGO_URI) {
    throw new Error("MONGO_URI not found");
}
async function connectDB() {
    try {
        const res = await mongoose.connect(MONGO_URI);
        if (res) {
            console.log("connected")
        }
    } catch (e) {
        console.log("server error", e);
    }

}
export default connectDB;