import dotenv from "dotenv";
dotenv.config();

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

/*
========================================
CORS
========================================
*/
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

/*
========================================
MIDDLEWARE
========================================
*/
app.use(express.json());

app.use(
  session({
    name: "contest.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // change to true when using HTTPS
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

/*
========================================
ROUTES
========================================
*/
app.use("/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api", contestRoutes);
app.use("/api/reminders", reminderRoutes);

/*
========================================
GLOBAL ERROR HANDLER
========================================
*/
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server Error" });
});

/*
========================================
START SERVER
========================================
*/
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});