import express from "express";
import Contest from "../models/contest.js";

const router = express.Router();

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const CLIST_USER = process.env.CLIST_USER;
const CLIST_KEY = process.env.CLIST_KEY;

const headers = {
  Authorization: `ApiKey ${CLIST_USER}:${CLIST_KEY}`,
  Accept: "application/json",
};

const formatContests = (raw, platform) => {
  return (raw || []).map((c) => ({
    id: `clist-${c.id}`,
    name: c.event,
    platform: platform,
    startTime: new Date(c.start),
    endTime: new Date(c.end),
    url: c.href,
  }));
};

router.post("/contests/sync", async (req, res) => {
  try {
    const contests = req.body;

    for (let c of contests) {
      await Contest.updateOne(
        { sourceId: c.id },
        {
          name: c.name,
          platform: c.platform,
          startTime: c.startTime,
          endTime: c.endTime,
          url: c.url,
          sourceId: c.id,
        },
        { upsert: true },
      );
    }

    res.json({ message: "Contests stored successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/contests/db", async (req, res) => {
  try {
    const contests = await Contest.find().sort({ startTime: 1 });
    res.json(contests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/contests", async (req, res) => {
  try {
    const urls = {
      leetcode:
        "https://clist.by/api/v4/contest/?upcoming=true&resource__regex=leetcode&limit=20&format=json",
      codeforces:
        "https://clist.by/api/v4/contest/?upcoming=true&resource__regex=codeforces&limit=20&format=json",
      codechef:
        "https://clist.by/api/v4/contest/?upcoming=true&resource__regex=codechef&limit=20&format=json",
      atcoder:
        "https://clist.by/api/v4/contest/?upcoming=true&resource__regex=atcoder&limit=20&format=json",
    };

    const results = await Promise.all(
      Object.entries(urls).map(async ([platform, url]) => {
        const r = await fetch(url, { headers });
        const d = await r.json();
        return formatContests(d.objects, platform);
      }),
    );

    const merged = results.flat().sort((a, b) => a.startTime - b.startTime);

    res.json(merged);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch contests" });
  }
});

// -------- NEW: PLATFORM SAVED STATUS --------
// -------- CORRECT PLATFORM STATUS BASED ON REMINDERS --------
import Reminder from "../models/reminder.js";

router.get("/contests/status", async (req, res) => {
  try {
    const platforms = ["leetcode", "codeforces", "codechef", "atcoder"];

    const result = {};

    for (const p of platforms) {
      const exists = await Reminder.findOne({
        $or: [{ platform: p }, { platform: p.toLowerCase() }],
      });

      result[p] = {
        allSaved: exists ? true : false,
      };
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
