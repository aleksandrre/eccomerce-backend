import nodemailer from "nodemailer";
import { IUserDocument } from "../models/UserModel";
import { env } from "../config/env";

const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.EMAIL_USERNAME,
      pass: env.APP_PASSWORD,
    },
  });

export async function sendVerificationEmail(
  user: IUserDocument
): Promise<void> {
  const transporter = createTransporter();
  const link = `${env.BASE_URL}/email/verify/${user.emailVerificationToken}`;

  await transporter.sendMail({
    from: env.EMAIL_USERNAME,
    to: user.email,
    subject: "Email Verification",
    html: `<p>გამარჯობა ${user.name},</p>
      <p>გმადლობთ რეგისტრაციისთვის! გთხოვთ დაადასტუროთ email:</p>
      <a href="${link}">${link}</a>`,
  });
}

export async function sendPasswordResetEmail(
  user: IUserDocument
): Promise<void> {
  const transporter = createTransporter();
  const link = `${env.BASE_URL}/email/reset-password/${user.resetToken}`;

  await transporter.sendMail({
    from: env.EMAIL_USERNAME,
    to: user.email,
    subject: "Password Reset",
    html: `<p>გამარჯობა ${user.name},</p>
      <p>პაროლის განახლების ბმული:</p>
      <a href="${link}">${link}</a>`,
  });
}
