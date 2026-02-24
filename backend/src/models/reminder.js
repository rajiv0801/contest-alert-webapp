import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["contest", "platform"],
      required: true,
    },

    platform: {
      type: String,
      required: true,
    },

    // Only used for contest reminders
    contestId: String,
    contestName: String,
    startTime: Date,
    contestLink: String,

    reminderTime: Date,

    // NEW FIELD
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Reminder", reminderSchema);
