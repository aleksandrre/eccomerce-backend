export function isAdmin(req, res, next) {
  const user = req.user;

  if (user && user.isAdmin) {
    // User is an admin, allow access to the next middleware or route
    next();
  } else {
    // User is not an admin, respond with unauthorized status
    res.status(403).json({ error: "Forbidden: Admin access required" });
  }
}
