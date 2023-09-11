require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const { connectDBs } = require("./config/db");
const routes = require("./routes/index");
const cron = require("node-cron");

main();

async function main() {
  connectDBs();

  const app = express();

  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  app.use(cors());

  app.use(express.urlencoded({ extended: true, limit: "50mb" }));
  app.use(express.json({ limit: "50mb" }));
  app.use(routes);

  app.enable("trust proxy");

  app.set("views", __dirname + "/views");
  app.set("view engine", "ejs");

  app.use("/images", express.static(__dirname + "/images"));

  //Runs callback at 2 AM on the first day of the month every other month
  cron.schedule("0 2 1 */2 *", async () => {
    await deleteUnusedFcmTokens();
  });

  const PORT = 8080;
  app.listen(
    PORT,
    console.log(
      "Server running in " + process.env.NODE_ENV + " mode on port " + PORT
    )
  );
}
