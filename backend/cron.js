import cron from "node-cron";
import Reminder from "./src/models/reminder.js";

const syncPlatformSubscriptions = async () => {
  try {
    console.log("Running platform sync job...");

    const subscriptions = await Reminder.find({
      type: "platform",
    });

    for (const sub of subscriptions) {
      const { userId, platform } = sub;

      const headers = {
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.CLIST_USER + ":" + process.env.CLIST_KEY
          ).toString("base64"),
      };

      const now = new Date().toISOString();

      const url = `https://clist.by/api/v4/contest/?username=${process.env.CLIST_USER}&api_key=${process.env.CLIST_KEY}&resource__name__icontains=${platform}&start__gte=${now}&order_by=start&limit=50`;

      const response = await fetch(url, { headers });
      const data = await response.json();

      const contests = data.objects || [];

      for (const contest of contests) {
        const contestId = contest.id.toString();

        const existing = await Reminder.findOne({
          userId,
          type: "contest",
          contestId,
        });

        if (existing) {
          // Skip if exists (including disabled ones)
          continue;
        }

        const reminderTime = new Date(
          new Date(contest.start).getTime() - 15 * 60000
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

        console.log(
          `Added new contest reminder for user ${userId} - ${contest.event}`
        );
      }
    }

  } catch (err) {
    console.error("Cron sync error:", err.message);
  }
};

// Run every 5 minutes
cron.schedule("*/5 * * * *", syncPlatformSubscriptions);

export default syncPlatformSubscriptions;