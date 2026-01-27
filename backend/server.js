import "./config/passport.js";
import authRoutes from "./src/routes/authRoutes.js";






app.use("/auth", authRoutes);
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const contestRoutes = require("./src/routes/contestRoutes.js");
app.use("/api", contestRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

import session from "express-session";
import passport from "passport";

app.use(
  session({
    secret: "contest-secret",
    resave: false,
    saveUninitialized: false,
  }),
);

app.use(passport.initialize());
app.use(passport.session());
