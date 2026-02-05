import express from "express";
const router = express.Router();

// temporary in-memory store
// structure: { userId : [ reminders ] }
const reminderStore = {};

// GET MY REMINDERS
router.get("/", (req, res) => {

  if (!req.user) {
    return res.status(401).json({ error: "not logged in" });
  }

  const userId = req.user.id;

  res.json(reminderStore[userId] || []);
});

// CREATE REMINDERS FOR PLATFORM
router.post("/platform/:platform", async (req, res) => {

  if (!req.user) {
    return res.status(401).json({ error: "not logged in" });
  }

  const platform = req.params.platform;
  const userId = req.user.id;

  try {

    // call your own contest API
    const response = await fetch(
      `http://localhost:5500/api/contests/${platform}`
    );

    const contests = await response.json();

    if (!reminderStore[userId]) {
      reminderStore[userId] = [];
    }

    let added = 0;

    for (let c of contests) {

      const exists = reminderStore[userId].find(
        (r) => r.contestId === c.id
      );

      if (!exists) {
        reminderStore[userId].push({
          contestId: c.id,
          name: c.name,
          platform: c.platform,
          startTime: c.startTime,
          url: c.url,
        });

        added++;
      }
    }

    res.json({
      message: "reminders created",
      added,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
