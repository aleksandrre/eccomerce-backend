import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/UserModel";
import { RefreshToken } from "../models/RefreshTokenModel";
import { generateAccessToken, generateRefreshToken } from "../utils/authUtils";
import { AuthRequest, JwtPayload } from "../types";

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    if (!user.emailVerified) {
      res.status(401).json({ message: "Email is not verified" });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const newRefreshToken = new RefreshToken({ token: refreshToken, userId: user._id });
    await newRefreshToken.save();

    res.json({ accessToken, refreshToken });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function token(req: Request, res: Response): Promise<void> {
  const refreshToken = req.body.token as string | undefined;
  if (!refreshToken) {
    res.status(401).send("Refresh token is missing or invalid.");
    return;
  }

  const existingRefreshToken = await RefreshToken.findOne({ token: refreshToken });
  if (!existingRefreshToken) {
    res.status(403).json({ message: "Invalid refresh token" });
    return;
  }

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string, (err, decoded) => {
    if (err) {
      res.sendStatus(403);
      return;
    }
    const accessToken = generateAccessToken(decoded as JwtPayload);
    res.json({ accessToken });
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const refreshToken = req.body.token as string | undefined;
    if (!refreshToken) {
      res.status(401).json({ message: "Refresh token is missing or invalid." });
      return;
    }

    const deleted = await RefreshToken.findOneAndDelete({ token: refreshToken });
    if (!deleted) {
      res.status(403).json({ message: "Invalid refresh token" });
      return;
    }

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { oldPassword, newPassword, newPasswordRepeat } = req.body;

    if (!newPassword || !oldPassword || !newPasswordRepeat) {
      res.status(400).json({ message: "გთხოვთ, შეიყვანოთ ძველი და ახალი პაროლი" });
      return;
    }
    if (oldPassword === newPassword) {
      res.status(400).json({ message: "ახალი პაროლი უნდა განსხვავდებოდეს ძველისგან" });
      return;
    }
    if (newPassword !== newPasswordRepeat) {
      res.status(400).json({ message: "შეყვანილი პაროლები არ ემთხვევა ერთმანეთს" });
      return;
    }

    const passwordRegex = /^[A-Z](?=.*\d)(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,24}$/;
    if (!passwordRegex.test(newPassword)) {
      res.status(400).json({
        message:
          "პაროლი უნდა შეიცავდეს მინიმუმ 8 და მაქსიმუმ 25 სიმბოლოს, პირველი ასო დიდი უნდა იყოს და მინიმუმ 1 სიმბოლო.",
      });
      return;
    }

    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ message: "იუზერი არ მოიძებნა" });
      return;
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ message: "ძველი პაროლი არასწორია" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "პაროლი წარმატებით განახლდა" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "სერვერზე შეცდომა" });
  }
};
