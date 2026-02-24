import express from "express";
import Reminder from "../models/reminder.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

/*
========================================
GET ALL REMINDERS (LOGGED IN USER)
========================================
*/
router.get("/my", isAuthenticated, async (req, res) => {
  try {
    const reminders = await Reminder.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(reminders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
========================================
CREATE CONTEST REMINDER
========================================
*/
router.post("/contest", isAuthenticated, async (req, res) => {
  try {
    const {
      contestId,
      contestName,
      platform,
      startTime,
      contestLink,
      reminderTime,
    } = req.body;

    // Prevent duplicate reminder
    const exists = await Reminder.findOne({
      userId: req.user._id,
      type: "contest",
      contestId,
    });

    if (exists) {
      return res.status(400).json({ message: "Reminder already exists" });
    }

    const reminder = await Reminder.create({
      userId: req.user._id,
      type: "contest",
      platform,
      contestId,
      contestName,
      startTime,
      contestLink,
      reminderTime,
    });

    res.status(201).json(reminder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
========================================
CREATE PLATFORM REMINDER
========================================
*/
router.post("/platform", isAuthenticated, async (req, res) => {
  try {
    const { platform } = req.body;

    const exists = await Reminder.findOne({
      userId: req.user._id,
      type: "platform",
      platform,
    });

    if (exists) {
      return res.status(400).json({ message: "Platform already scheduled" });
    }

    const reminder = await Reminder.create({
      userId: req.user._id,
      type: "platform",
      platform,
    });

    res.status(201).json(reminder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
========================================
DELETE SINGLE CONTEST REMINDER
========================================
*/
router.delete("/contest/:contestId", isAuthenticated, async (req, res) => {
  try {
    await Reminder.deleteOne({
      userId: req.user._id,
      type: "contest",
      contestId: req.params.contestId,
    });

    res.json({ message: "Contest reminder removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/*
========================================
DELETE ALL REMINDERS OF A PLATFORM
========================================
*/
router.delete("/platform/:platform", isAuthenticated, async (req, res) => {
  try {
    await Reminder.deleteMany({
      userId: req.user._id,
      platform: req.params.platform,
    });

    res.json({ message: "All reminders for platform removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;