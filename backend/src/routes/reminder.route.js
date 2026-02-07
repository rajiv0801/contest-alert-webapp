import express from "express";
import Reminder from "../models/reminder.js";
import Contest from "../models/contest.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

// Create reminders from STORED contests
router.post("/create/:platform", isAuthenticated, async (req, res) => {
  try {
    const { platform } = req.params;

    const contests = await Contest.find({ platform });

    let created = [];

    for (let contest of contests) {
      const already = await Reminder.findOne({
        userId: req.user.id,
        contestName: contest.name,
      });

      if (!already) {
        const reminder = await Reminder.create({
          userId: req.user.id,
          platform,
          contestName: contest.name,
          startTime: contest.startTime,

          reminderTime: new Date(
            new Date(contest.startTime).getTime() - 30 * 60 * 1000
          ),

          contestLink: contest.url,
        });

        created.push(reminder);
      }
    }

    res.status(200).json({
      message: "Reminders created successfully",
      totalCreated: created.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create reminders",
      error: error.message,
    });
  }
});

// Get user reminders
router.get("/", async (req, res) => {
  try {
    const reminders = await Reminder.find();
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
