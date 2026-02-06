import express from "express";
import Reminder from "../models/reminder.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

router.post("/create/:platform", isAuthenticated, async (req, res) => {
  try {
    const { platform } = req.params;

    const reminder = await Reminder.create({
      userId: req.user.id,
      platform,
      contestName: "platform reminder",
      startTime: new Date(),
      reminderTime: new Date(Date.now() + 30 * 60 * 1000),
      contestLink: "",
    });

    res.status(200).json({
      message: "Reminder created",
      reminder,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create reminder",
      error: error.message,
    });
  }
});

router.get("/my", isAuthenticated, async (req, res) => {
  try {
    const reminders = await Reminder.find({
      userId: req.user.id,
    });

    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
