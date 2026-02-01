import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";

// Load passport config
import "./config/passport.js";

// Routes
import authRoutes from "./src/routes/authRoutes.js";
import contestRoutes from "./src/routes/contestRoutes.js";

import userRoutes from "./src/routes/userRoutes.js";

const app = express();

app.use(cors({
  origin: "http://localhost:5500",
  credentials: true
}));
app.use(express.json());

// Session
app.use(
  session({
    name: "contest.sid",
    secret: "contest-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "none",
      secure: false,   // required for localhost
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);


// Passport
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/users", userRoutes);

// Routes
app.use("/auth", authRoutes);
app.use("/api", contestRoutes);

// Server start
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
