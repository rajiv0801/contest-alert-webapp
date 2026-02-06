import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema({
  userId: String,
  platform: String,
  contestName: String,
  startTime: Date,
  reminderTime: Date,
  contestLink: String,
});

export default mongoose.model("Reminder", reminderSchema);
