import express from "express";
import passport from "passport";

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5500/frontend/index.html",
  }),
  (req, res) => {
    res.redirect("http://localhost:5500/frontend/index.html");
  }
);

router.get("/logout", (req, res) => {
  req.logout(() => {
    if (req.session) {
      req.session.destroy(() => {
        res.clearCookie("contest.sid");
        res.redirect("http://localhost:5500/frontend/index.html");
      });
    } else {
      res.redirect("http://localhost:5500/frontend/index.html");
    }
  });
});

export default router;
