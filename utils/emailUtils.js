// controllers/emailUtils.js
import nodemailer from "nodemailer";

export async function sendVerificationEmail(user) {
  try {
    // Create a nodemailer transporter using Gmail credentials
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, // Set to false to accept self-signed certificates
      },
    });

    // Construct the verification link using the generated token
    const verificationLink = `${process.env.BASE_URL}/email/verify/${user.emailVerificationToken}`;

    // Compose email options
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: user.email,
      subject: "Email Verification",
      html: `<p>Hello ${user.username},</p>
          <p>Thank you for registering! Please click the following link to verify your email:</p>
          <a href="${verificationLink}">${verificationLink}</a>`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending verification email:", error);
    // Handle the error appropriately
    throw error; // Rethrow the error to be caught in the calling function
  }
}

export async function sendPasswordResetEmail(user) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false, // Set to false to accept self-signed certificates
    },
  });

  const resetLink = `${process.env.BASE_URL}/reset-password/${user.resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: user.email,
    subject: "Password Reset",
    html: `<p>Hello ${user.username},</p>
        <p>You have requested a password reset. Click the following link to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>`,
  };

  await transporter.sendMail(mailOptions);
}
