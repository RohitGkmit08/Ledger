const nodemailer = require("nodemailer")
const userModel = require("../models/user.model")

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
    
    // using transporter to send email
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

async function  sendRegistrationEmail(userEmail, userName) {
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

async function sendTransactionEmail({
  fromUserId,
  toUserId,
  fromAccount,
  toAccount,
  amount,
  status,
  transactionId
}) {
  try {

    const fromUser = await userModel.findById(fromUserId);

    const toUser = await userModel.findById(toUserId);

    if (!fromUser || !toUser) {
      throw new Error("User not found");
    }

    const subject = `Transaction ${status}`;

    await Promise.all([
      sendEmail(
        fromUser.email,
        subject,
        `Transferred ${amount} INR`,
        `<h2>Hello ${fromUser.name}</h2>
         <p>You transferred ${amount} INR.</p>`
      ),

      sendEmail(
        toUser.email,
        subject,
        `Received ${amount} INR`,
        `<h2>Hello ${toUser.name}</h2>
         <p>You received ${amount} INR.</p>`
      )
    ]);

  } catch (err) {
    console.error(err);
  }
}

module.exports = { sendRegistrationEmail, sendTransactionEmail }