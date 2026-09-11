import mongoose from "mongoose";

export async function connectDatabase(mongoUri) {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  await mongoose.connect(mongoUri, {
    autoIndex: true,
  });
}
