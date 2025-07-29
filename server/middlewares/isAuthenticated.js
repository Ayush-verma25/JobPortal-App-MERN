import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    const token =
      req.cookies.token ||
      (req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null);

    if (!token) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
        success: false,
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // Attach user info to request
    req.id = decoded.userId;
    req.user = decoded;

    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);

    // Handle specific JWT errors
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid token signature",
        success: false,
      });
    } else if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token has expired",
        success: false,
      });
    } else {
      return res.status(401).json({
        message: "Token verification failed",
        success: false,
      });
    }
  }
};

export default isAuthenticated;
