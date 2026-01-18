const express = require("express");
const router = express.Router();

// --------------------------------------------------
// Contest API Route (LeetCode + Codeforces)
// --------------------------------------------------

router.get("/contests", async (req, res) => {
  try {
    let leetcodeContests = [];
    let codeforcesContests = [];

    // -------------------- LeetCode --------------------
    try {
      const lcRes = await fetch(
        "https://alfa-leetcode-api.onrender.com/contests/upcoming"
      );

      const lcData = await lcRes.json();
      const rawList = lcData.contests || [];

      leetcodeContests = rawList.map((c) => ({
        id: `leetcode-${c.titleSlug}`,
        name: c.title,
        platform: "LeetCode",
        startTime: c.startTime * 1000, // seconds → ms
        duration: Math.round(c.duration / 60), // seconds → minutes
        url: `https://leetcode.com/contest/${c.titleSlug}/`,
      }));
    } catch (err) {
      console.warn("LeetCode API unavailable, skipping.");
    }

    // -------------------- Codeforces --------------------
    try {
      const cfRes = await fetch("https://codeforces.com/api/contest.list");

      const cfData = await cfRes.json();

      if (cfData.status === "OK") {
        codeforcesContests = cfData.result
          .filter((c) => c.phase === "BEFORE")
          .map((c) => ({
            id: `cf-${c.id}`,
            name: c.name,
            platform: "Codeforces",
            startTime: c.startTimeSeconds * 1000, // seconds → ms
            duration: Math.round(c.durationSeconds / 60),
            url: `https://codeforces.com/contest/${c.id}`,
          }));
      }
    } catch (err) {
      console.warn("Codeforces API unavailable, skipping.");
    }

    // -------------------- Merge --------------------
    const contests = [...leetcodeContests, ...codeforcesContests];

    // Sort by upcoming time (earliest first)
    contests.sort((a, b) => a.startTime - b.startTime);

    res.json(contests);
  } catch (error) {
    console.error("Contest API error:", error);
    res.status(500).json({
      error: "Unable to fetch contest data",
    });
  }
});

module.exports = router;
