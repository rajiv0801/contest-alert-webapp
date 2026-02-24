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
    const userId = req.user._id;

    if (!platform) {
      return res.status(400).json({ message: "Platform required" });
    }

    // Check if subscription already exists
    const existingSubscription = await Reminder.findOne({
      userId,
      type: "platform",
      platform,
    });

    if (existingSubscription) {
      return res.status(400).json({ message: "Platform already subscribed" });
    }

    // Create subscription flag
    await Reminder.create({
      userId,
      type: "platform",
      platform,
    });

    // ---------------- FETCH CONTESTS FROM CLIST ----------------
    const headers = {
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.CLIST_USER + ":" + process.env.CLIST_KEY,
        ).toString("base64"),
    };

    const now = new Date().toISOString();

    const url = `https://clist.by/api/v4/contest/?username=${process.env.CLIST_USER}&api_key=${process.env.CLIST_KEY}&resource__name__icontains=${platform}&start__gte=${now}&order_by=start&limit=50`;

    const response = await fetch(url, { headers });
    const data = await response.json();

    const contests = data.objects || [];

    for (const contest of contests) {
      const contestId = contest.id.toString();

      const exists = await Reminder.findOne({
        userId,
        type: "contest",
        contestId,
      });

      if (exists) continue; // skip duplicates & disabled

      const reminderTime = new Date(
        new Date(contest.start).getTime() - 15 * 60000, // default 15 min
      );

      await Reminder.create({
        userId,
        type: "contest",
        platform,
        contestId,
        contestName: contest.event,
        startTime: contest.start,
        contestLink: contest.href,
        reminderTime,
      });
    }

    res.json({ message: "Platform subscription activated" });
  } catch (err) {
    console.error(err);
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
    const { contestId } = req.params;
    const userId = req.user._id;

    // Check if platform subscription exists
    const contestReminder = await Reminder.findOne({
      userId,
      type: "contest",
      contestId,
    });

    if (!contestReminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    const platformSubscription = await Reminder.findOne({
      userId,
      type: "platform",
      platform: contestReminder.platform,
    });

    if (platformSubscription) {
      // If subscription active → disable instead of delete
      contestReminder.disabled = true;
      await contestReminder.save();

      return res.json({ message: "Contest reminder disabled" });
    }

    // If no subscription → delete normally
    await Reminder.deleteOne({
      userId,
      type: "contest",
      contestId,
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
