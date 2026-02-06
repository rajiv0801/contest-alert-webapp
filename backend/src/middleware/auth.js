export const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  if (req.user) {
    return next();
  }

  res.status(401).json({ message: "Unauthorized" });
};
