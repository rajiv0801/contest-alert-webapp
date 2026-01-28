import express from "express";
import passport from "passport";

const router = express.Router();

// Start Google login
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback after Google login
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://127.0.0.1:5500/frontend/index.html",
  }),
  (req, res) => {
    // Redirect to your frontend
    res.redirect("http://127.0.0.1:5500/frontend/index.html");
  }
);

// Logout
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("http://127.0.0.1:5500/frontend/index.html");
  });
});

export default router;
