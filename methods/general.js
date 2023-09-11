const User = require("../models/user");
const Token = require("../models/token");

var functions = {
  cleardb: async function (req, res) {
    await User.deleteMany({});
    await Token.deleteMany({});
    return res.status(200).json({ message: "Database Cleared" });
  },
};

module.exports = functions;
