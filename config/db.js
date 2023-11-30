const mongoose = require("mongoose");

const state = {
  conn1: null,
};
const connectDBs = async () => {
  await connectDB1();
  console.log("Databases connected");
};

async function connectDB1() {
  try {
    var conn;
    if (process.env.NODE_ENV === "development") {
      DB_HOST
      conn = await mongoose.connect(process.env.DB_HOST, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    } else {
      conn = await mongoose.connect(process.env.DB_HOST, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    state.conn1 = conn;
    console.log("MongoDB Connected: " + conn.connection.host);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

module.exports = {
  connectDBs,
  state,
};