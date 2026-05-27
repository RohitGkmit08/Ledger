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

async function sendTransactionEmail({ fromUser, toUser, fromAccount, toAccount, amount, status, transactionId }) {
  try {
    const subject = `Transaction Notification: ${status}`;
    
    // Sender Email Content
    const senderText = `Hello ${fromUser.name},\n\nYour transfer of ${amount} INR to account ${toAccount} was ${status.toLowerCase()}.\nTransaction ID: ${transactionId}`;
    const senderHtml = `
      <h2>Transaction Notification</h2>
      <p>Hello <strong>${fromUser.name}</strong>,</p>
      <p>Your transfer of <strong>${amount} INR</strong> to account <code>${toAccount}</code> was <strong>${status}</strong>.</p>
      <p>Transaction ID: <code>${transactionId}</code></p>
    `;

    // Receiver Email Content
    const receiverText = `Hello ${toUser.name},\n\nYou have received a transfer of ${amount} INR from account ${fromAccount}.\nTransaction ID: ${transactionId}`;
    const receiverHtml = `
      <h2>Transaction Notification</h2>
      <p>Hello <strong>${toUser.name}</strong>,</p>
      <p>You have received a transfer of <strong>${amount} INR</strong> from account <code>${fromAccount}</code>.</p>
      <p>Transaction ID: <code>${transactionId}</code></p>
    `;

    await Promise.all([
      sendEmail(fromUser.email, subject, senderText, senderHtml),
      sendEmail(toUser.email, subject, receiverText, receiverHtml)
    ]);

    console.log("Transaction emails sent successfully");
  } catch (error) {
    console.error("Error sending transaction email:", error);
  }
}

module.exports = { sendRegistrationEmail, sendTransactionEmail }