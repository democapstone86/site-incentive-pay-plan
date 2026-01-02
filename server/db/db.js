import mongoose from "mongoose";

const MONGO_URI =
  "mongodb+srv://democapstone86_db_user:Github123@cluster0.dr45fyw.mongodb.net/?appName=Cluster0";

export async function connectDB() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ MongoDB connected");
}
