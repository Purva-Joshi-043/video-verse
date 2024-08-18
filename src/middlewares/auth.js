require("dotenv").config();

module.exports = (req, res, next) => {
  const token = req.headers["authorization"];

  if (token === process.env.API_TOKEN || "your_static_api_token") {
    next();
  } else {
    res.status(403).json({ message: "Forbidden" });
  }
};
