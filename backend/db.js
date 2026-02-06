import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Mongo connected");
  } catch (err) {
    console.log("DB error:", err);
  }
};

export default connectDB;
