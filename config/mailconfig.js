// if (process.env.NODE_ENV === "development") {
// module.exports = {
//   host: "sandbox.smtp.mailtrap.io",
//   port: "587",
//   auth: {
//     user: "a03467227a2d95",
//     pass: "60d2eb2f64e68c",
//   },
// };
// } else {
module.exports = {
  host: "smtp.gmail.com",
  // port: "587",
  port: "465",
  auth: {
    user: "moneytracker.biuro@gmail.com",
    pass: process.env.MAILER_PSW,
  },
};
// }
