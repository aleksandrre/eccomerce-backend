import nodemailer from "nodemailer";
import { IUserDocument } from "../models/UserModel";

const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

export async function sendVerificationEmail(user: IUserDocument): Promise<void> {
  try {
    const transporter = createTransporter();
    const verificationLink = `${process.env.BASE_URL}/email/verify/${user.emailVerificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: user.email,
      subject: "Email Verification",
      html: `<p>გამარჯობა ${user.name},</p>
        <p>გმადლობთ რეგისტრაციისთვის! გთხოვთ დააჭიროთ ბმულს Email-ის დასადასტურებლად:</p>
        <a href="${verificationLink}">${verificationLink}</a>`,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
}

export async function sendPasswordResetEmail(user: IUserDocument): Promise<void> {
  const transporter = createTransporter();
  const resetLink = `${process.env.BASE_URL}/email/reset-password/${user.resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: user.email,
    subject: "Password Reset",
    html: `<p>გამარჯობა ${user.name},</p>
      <p>თქვენ მოითხოვეთ პაროლის განახლება. დააჭირეთ ბმულს:</p>
      <a href="${resetLink}">${resetLink}</a>`,
  };

  await transporter.sendMail(mailOptions);
}
