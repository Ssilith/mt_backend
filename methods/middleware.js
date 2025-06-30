const User = require("../models/user");
const jwt = require("jsonwebtoken");

exports.verify = async function (req, res, next) {
  let accessToken = req.headers.authorization;

  if (!accessToken) {
    return res.status(403).json({ success: false });
  }

  let payload;
  try {
    payload = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
    req.body.decodedToken = payload;

    let user = await User.findById(payload._id);
    req.body.user = user;
    next();
  } catch (e) {
    ///Status 401 is reserved for access token validation -> it will trigger in the client a call to /refreshToken endpoint
    return res.status(401).json({ success: false });
  }
};
