import express from "express";
const router = express.Router();

// dynamic import for node-fetch
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const CLIST_USER = process.env.CLIST_USER;
const CLIST_KEY = process.env.CLIST_KEY;

// -------------------- Unified Contest API (All Platforms via CLIST) --------------------
router.get("/contests", async (req, res) => {
  try {
    const url =
      "https://clist.by/api/v4/contest/?upcoming=true&limit=100&format=json";

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
        platform: c.resource?.name || c.host || "Unknown",
        startTime: new Date(c.start).getTime(),
        endTime: new Date(c.end).getTime(),
        duration: c.duration,
        url: c.href,
      }))
      .sort((a, b) => a.startTime - b.startTime);

    res.json(contests);
  } catch (error) {
    console.error("CLIST API runtime error:", error.message);
    res.status(500).json({
      error: "Failed to fetch contest data",
    });
  }
});

export default router;

