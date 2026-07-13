import jwt from "jsonwebtoken";

/**
 * Lightweight JWT authentication middleware.
 *
 * Reads the Authorization header, verifies the JWT, and attaches
 * req.user = { id: <userId> } to the request for downstream use.
 *
 * The authenticated user identity is ALWAYS derived from the verified
 * JWT payload — never trusted from request body, params, or query.
 *
 * Does NOT perform a database lookup on every request (lightweight).
 * If a route needs the full User document it can fetch it explicitly.
 */
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach only the id — routes can fetch the full user if needed
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Unauthorized" });
  }
};