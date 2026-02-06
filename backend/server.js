import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";

import "./config/passport.js";

import authRoutes from "./src/routes/authRoutes.js";
import contestRoutes from "./src/routes/contestRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import reminderRoutes from "./src/routes/reminder.route.js";

import connectDB from "./db.js";

connectDB();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5500",
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    name: "contest.sid",
    secret: "contest-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api", contestRoutes);
app.use("/api/reminders", reminderRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
