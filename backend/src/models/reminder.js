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

    // Used only when type = "contest"
    contestId: {
      type: String,
    },

    contestName: {
      type: String,
    },

    startTime: {
      type: Date,
    },

    contestLink: {
      type: String,
    },

    reminderTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Reminder", reminderSchema);