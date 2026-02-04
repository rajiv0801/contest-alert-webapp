import express from "express";
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
    startTime: new Date(c.start).getTime(),
    endTime: new Date(c.end).getTime(),
    duration: c.duration,
    url: c.href,
  }));
};

// ---------- Individual Platform Endpoints ----------

// 1. LeetCode
router.get("/contests/leetcode", async (req, res) => {
  try {
    const url =
      "https://clist.by/api/v4/contest/?upcoming=true&resource__regex=leetcode&limit=20&format=json";

    const response = await fetch(url, { headers });
    const data = await response.json();

    res.json(formatContests(data.objects, "leetcode"));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leetcode contests" });
  }
});

// 2. CodeForces
router.get("/contests/codeforces", async (req, res) => {
  try {
    const url =
      "https://clist.by/api/v4/contest/?upcoming=true&resource__regex=codeforces&limit=20&format=json";

    const response = await fetch(url, { headers });
    const data = await response.json();

    res.json(formatContests(data.objects, "codeforces"));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch codeforces contests" });
  }
});

// 3. CodeChef
router.get("/contests/codechef", async (req, res) => {
  try {
    const url =
      "https://clist.by/api/v4/contest/?upcoming=true&resource__regex=codechef&limit=20&format=json";

    const response = await fetch(url, { headers });
    const data = await response.json();

    res.json(formatContests(data.objects, "codechef"));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch codechef contests" });
  }
});

// 4. AtCoder
router.get("/contests/atcoder", async (req, res) => {
  try {
    const url =
      "https://clist.by/api/v4/contest/?upcoming=true&resource__regex=atcoder&limit=20&format=json";

    const response = await fetch(url, { headers });
    const data = await response.json();

    res.json(formatContests(data.objects, "atcoder"));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch atcoder contests" });
  }
});

// ---------- Unified Endpoint (Frontend Friendly) ----------
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
