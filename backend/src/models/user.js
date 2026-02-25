import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  googleId: String,
  name: String,
  email: String,

  contestPreferences: {
    type: [String],
    default: [],
  },
  savedContests: [
    {
      contestId: { type: String, required: true },
      platform: { type: String, required: true },
      contestDate: { type: Date, required: true },
      active: { type: Boolean, default: true },
    },
  ],
});

export default mongoose.model("User", userSchema);
