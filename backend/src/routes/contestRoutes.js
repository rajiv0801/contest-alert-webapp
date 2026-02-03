import express from "express";
const router = express.Router();

// dynamic import for node-fetch
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const CLIST_USER = process.env.CLIST_USER;
const CLIST_KEY = process.env.CLIST_KEY;

// -------------------- Unified Contest API --------------------
router.get("/contests", async (req, res) => {
  try {

    // 1. Main request (all contests)
    const mainUrl =
      "https://clist.by/api/v4/contest/?upcoming=true&limit=100&format=json";

    // 2. Separate LeetCode request to avoid pagination loss
    const lcUrl =
      "https://clist.by/api/v4/contest/?upcoming=true&resource__regex=leetcode&limit=20&format=json";

    const headers = {
      Authorization: `ApiKey ${CLIST_USER}:${CLIST_KEY}`,
      Accept: "application/json",
    };

    const [mainRes, lcRes] = await Promise.all([
      fetch(mainUrl, { headers }),
      fetch(lcUrl, { headers }),
    ]);

    const mainData = await mainRes.json();
    const lcData = await lcRes.json();

    // Merge both results
    const raw = [
      ...(mainData.objects || []),
      ...(lcData.objects || []),
    ];

    const contests = raw
      .map((c) => {

        // Detect platform from URL (most reliable)
        const link = String(c.href || "").toLowerCase();

        let platform = "unknown";

        if (link.includes("leetcode")) platform = "leetcode";
        else if (link.includes("codeforces")) platform = "codeforces";
        else if (link.includes("codechef")) platform = "codechef";
        else if (link.includes("atcoder")) platform = "atcoder";

        return {
          id: `clist-${c.id}`,
          name: c.event,
          platform: platform,
          startTime: new Date(c.start).getTime(),
          endTime: new Date(c.end).getTime(),
          duration: c.duration,
          url: c.href,
        };
      })
      .sort((a, b) => a.startTime - b.startTime);

    res.json(contests);

  } catch (error) {
    console.error("CLIST API runtime error:", error.message);
    res.status(500).json({
      error: "Failed to fetch contest data",
    });
  }
});

// -------- DEBUG: CHECK LEETCODE RAW DATA --------
router.get("/proof/lc", async (req, res) => {
  try {
    const url =
      "https://clist.by/api/v4/contest/?upcoming=true&resource__regex=leetcode&limit=20&format=json";

    const response = await fetch(url, {
      headers: {
        Authorization: `ApiKey ${CLIST_USER}:${CLIST_KEY}`,
        Accept: "application/json",
      },
    });

    const data = await response.json();

    const raw = data.objects || [];

    res.json({
      totalFromLeetRequest: raw.length,

      samples: raw.slice(0, 3).map((c) => ({
        event: c.event,
        href: c.href,
        start: c.start,
      })),
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
