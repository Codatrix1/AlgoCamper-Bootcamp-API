const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    // service: "Gmail",
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Activate in Gmail: "https://www.google.com/settings/security/lesssecureapps. Select the radio button to allow "Less Secure Apps""
  });

  // 2) Define the email options
  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };
  // 3) Actually send the Email with Nodemailer
  const info = await transporter.sendMail(message);
  //   await transporter.sendMail(message);

  console.log("Message sent: %s", info.messageId);
};

//----------
// Export
//----------
module.exports = sendEmail;
