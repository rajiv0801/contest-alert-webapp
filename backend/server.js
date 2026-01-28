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
    origin: [
      "http://127.0.0.1:5500",
      "http://localhost:5500"
    ],
    credentials: true                 // allow cookies
  }));
app.use(express.json());

// Session
app.use(
  session({
    secret: "contest-secret",
    resave: false,
    saveUninitialized: false,
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
