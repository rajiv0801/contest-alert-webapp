import express from "express";
import Reminder from "../models/reminder.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

// GET reminders of logged in user
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

// CREATE new reminder  👈 THIS WAS MISSING
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const { platform, time } = req.body;

    const reminder = new Reminder({
      platform,
      time,
      userId: req.user.id,
    });

    await reminder.save();

    res.status(201).json(reminder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


// DELETE reminder
router.delete("/:platform", isAuthenticated, async (req, res) => {
  try {
    await Reminder.deleteOne({
      platform: req.params.platform,
      userId: req.user.id
    });

    res.json({ message: "removed" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

