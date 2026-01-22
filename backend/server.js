const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
// console.log("CLIST_USER:", process.env.CLIST_USER);

const app = express();

app.use(cors());
app.use(express.json());

const contestRoutes = require("./src/routes/contestRoutes");
app.use("/api", contestRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/api/test-clist", async (req, res) => {
  try {
    const response = await fetch(
      `https://clist.by/api/v4/contest/?username=${process.env.CLIST_USER}&api_key=${process.env.CLIST_KEY}`,
    );

    const rawText = await response.text();
    console.log("RAW CLIST RESPONSE:\n", rawText.substring(0, 1000));

    return res.send(rawText);
  } catch (err) {
    console.error("CLIST test error:", err.message);
    res.status(500).send("CLIST failed");
  }
});

app.get("/api/contests", async (req, res) => {
  try {
    const response = await fetch(
      `https://clist.by/api/v4/contest/?username=${process.env.CLIST_USER}&api_key=${process.env.CLIST_KEY}&limit=100`
    );

    const data = await response.json();

    const contests = data.objects.map((c) => ({
      name: c.event,
      platform: c.resource?.name || c.host || "Unknown",
      startTime: c.start,
      endTime: c.end,
      duration: c.duration,
      url: c.href
    }));

    res.json(contests);
  } catch (err) {
    console.error("CLIST API error:", err.message);
    res.status(500).json({ error: "Failed to fetch contests" });
  }
});
