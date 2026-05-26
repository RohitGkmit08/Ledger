const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth : {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN
    }
})

transporter.verify((error, success) => {
    if(error){
        console.log("error in connecting to mail server :", error)
    }else{
        console.log("Email server is ready to send messages")
    }
})

const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend Ledger" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

async function sendRegistrationEmail(userEmail, userName) {
  try {
    const subject = "Registration Successful";

    const text = `Hello ${userName}, your registration was successful.`;

    const html = `
      <h2>Hello ${userName},</h2>
      <p>Your registration was successful.</p>
      <p>Welcome to our platform!</p>
    `;

    await sendEmail(userEmail, subject, text, html);

    console.log("Registration email sent successfully");
  } catch (error) {
    console.error("Error sending registration email:", error);
    throw error;
  }
}

module.exports = {sendRegistrationEmail}