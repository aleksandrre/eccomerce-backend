import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    // If the token is missing or not in the expected format, send a custom message and status 330
    return res
      .status(330)
      .send("Token is missing or not in the expected format");
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      // If verification fails, send a custom message and status 331
      return res.status(331).send("Token verification failed");
    }

    // If the token is successfully verified, attach the user information to the request
    req.user = user;

    // Call the next middleware in the chain
    next();
  });
}
