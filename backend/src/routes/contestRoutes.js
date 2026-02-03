import express from "express";
const router = express.Router();

// dynamic import for node-fetch
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const CLIST_USER = process.env.CLIST_USER;
const CLIST_KEY = process.env.CLIST_KEY;

const SUPPORTED_PLATFORMS = [
  "leetcode",
  "codeforces",
  "codechef",
  "atcoder"
];

// -------------------- Unified Contest API --------------------
router.get("/contests", async (req, res) => {
  try {
    const url =
      "https://clist.by/api/v4/contest/?upcoming=true&format=json";

    const response = await fetch(url, {
      headers: {
        Authorization: `ApiKey ${CLIST_USER}:${CLIST_KEY}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const badText = await response.text();
      console.error("CLIST HTTP error:", response.status, badText);
      return res.status(500).json({ error: "CLIST request failed" });
    }

    const rawText = await response.text();

    if (!rawText) {
      console.error("CLIST returned empty response");
      return res.status(500).json({ error: "Empty response from CLIST" });
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.error("CLIST parse error. Raw response:", rawText);
      return res.status(500).json({ error: "Invalid JSON from CLIST" });
    }

    if (!Array.isArray(data.objects)) {
      console.error("Unexpected CLIST payload:", data);
      return res.status(500).json({ error: "Unexpected CLIST payload" });
    }

    const contests = data.objects
      .map((c) => ({
        id: `clist-${c.id}`,
        name: c.event,

        platform: (() => {
          const link = String(c.href || "").toLowerCase();

          if (link.includes("leetcode")) return "leetcode";
          if (link.includes("codeforces")) return "codeforces";
          if (link.includes("codechef")) return "codechef";
          if (link.includes("atcoder")) return "atcoder";

          return "unknown";
        })(),

        startTime: new Date(c.start).getTime(),
        endTime: new Date(c.end).getTime(),
        duration: c.duration,
        url: c.href,
      }))
      .filter(c => SUPPORTED_PLATFORMS.includes(c.platform))
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
      "https://clist.by/api/v4/contest/?upcoming=true&limit=200&format=json";

    const response = await fetch(url, {
      headers: {
        Authorization: `ApiKey ${CLIST_USER}:${CLIST_KEY}`,
        Accept: "application/json",
      },
    });

    const data = await response.json();

    const raw = data.objects || [];

    const leetItems = raw.filter((c) => {
      const link = String(c.href || "").toLowerCase();
      return link.includes("leetcode");
    });

    res.json({
      totalFromClist: raw.length,

      leetCount: leetItems.length,

      samples: leetItems.slice(0, 3).map((c) => ({
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
