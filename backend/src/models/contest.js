import mongoose from "mongoose";

const contestSchema = new mongoose.Schema({
  name: String,
  platform: String,
  startTime: Date,
  endTime: Date,
  url: String,
  sourceId: String
});

export default mongoose.model("Contest", contestSchema);
