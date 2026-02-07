import express from "express";
import Contest from "../models/contest.js";

const router = express.Router();

// dynamic import for node-fetch
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const CLIST_USER = process.env.CLIST_USER;
const CLIST_KEY = process.env.CLIST_KEY;

const headers = {
  Authorization: `ApiKey ${CLIST_USER}:${CLIST_KEY}`,
  Accept: "application/json",
};

// ---------- Helper to format contests ----------
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

// ---------- STORE CONTESTS IN DB ----------
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
        { upsert: true }
      );
    }

    res.json({ message: "Contests stored successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- GET FROM DB ----------
router.get("/contests/db", async (req, res) => {
  try {
    const contests = await Contest.find().sort({ startTime: 1 });
    res.json(contests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- FETCH FROM CLIST (existing) ----------
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
      })
    );

    const merged = results.flat().sort((a, b) => a.startTime - b.startTime);

    res.json(merged);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch contests" });
  }
});

export default router;
