if (process.env.NODE_ENV === "development") {
  module.exports = {
    host: "smtp.mailtrap.io",
    port: "2525",
    auth: {
      user: "e843dd81a0ba7c",
      pass: "6c297f725e0d38",
    },
  };
} else {
  // module.exports = {
  //   host: "smtp.gmail.com",
  //   port: "587",
  //   auth: {
  //     user: "noreply.renx@gmail.com",
  //     pass: process.env.MAILER_PSW,
  //   },
  // };
}
