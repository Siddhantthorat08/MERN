require("dotenv").config();
const nodemailer = require("nodemailer");

const mailSender = async (options) => {

  const mailTransporter = nodemailer.createTransport({
    service:"gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  });

  const mailOptions = {
    from: `"MERN App" <hello@mernapp.com>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  await mailTransporter.sendMail(mailOptions);
};

module.exports = mailSender;
