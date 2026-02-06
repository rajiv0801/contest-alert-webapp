import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  googleId: String,
  name: String,
  email: String,

  contestPreferences: {
    type: [String],
    default: [],
  },
});

export default mongoose.model("User", userSchema);
