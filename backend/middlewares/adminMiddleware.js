const jwt = require("jsonwebtoken");
const { verifyAccessToken } = require("../services/tokenService");
const cookieParser = require("cookie-parser");

const adminMiddleware = (req, res, next) => {
  // console.log(req.user)
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied",
    });
  }

  next();
};

module.exports = adminMiddleware;
