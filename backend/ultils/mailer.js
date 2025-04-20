// backend/utils/mailer.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD, // dùng app password nếu là Gmail
  },
});

const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"WEB EDUCATION" <${process.env.EMAIL_USERNAME}>`,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent to:", to);
  } catch (error) {
    console.error("❌ Email sending failed:", error);
  }
};

module.exports = { sendEmail };
