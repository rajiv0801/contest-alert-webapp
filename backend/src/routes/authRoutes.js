import express from "express";
import passport from "passport";

const router = express.Router();

// Start Google login
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  }),
);

// Callback after Google login
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5500/frontend/index.html",
  }),
  (req, res) => {
    // Redirect to your frontend
    res.redirect("http://localhost:5500/frontend/index.html");
  },
);

// Logout
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.redirect("http://localhost:5500/frontend/index.html");
    }

    if (req.session) {
      req.session.destroy(() => {
        res.clearCookie("contest.sid");
        return res.redirect("http://localhost:5500/frontend/index.html");
      });
    } else {
      return res.redirect("http://localhost:5500/frontend/index.html");
    }
  });
});

export default router;
