import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../../../shared/models/UserModel";
import { RefreshToken } from "../../../shared/models/RefreshTokenModel";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../../shared/utils/authUtils";
import { AuthRequest, JwtPayload } from "../../../types";

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.emailVerified) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    if (!(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await new RefreshToken({ token: refreshToken, userId: user._id }).save();

    res.json({ accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const token = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.body.token as string | undefined;
  if (!refreshToken) {
    res.status(401).send("Refresh token missing");
    return;
  }

  const exists = await RefreshToken.findOne({ token: refreshToken });
  if (!exists) {
    res.status(403).json({ message: "Invalid refresh token" });
    return;
  }

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET as string,
    (err, decoded) => {
      if (err) {
        res.sendStatus(403);
        return;
      }
      res.json({ accessToken: generateAccessToken(decoded as JwtPayload) });
    }
  );
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.body.token as string | undefined;
    if (!refreshToken) {
      res.status(401).json({ message: "Refresh token missing" });
      return;
    }

    const deleted = await RefreshToken.findOneAndDelete({
      token: refreshToken,
    });
    if (!deleted) {
      res.status(403).json({ message: "Invalid refresh token" });
      return;
    }

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { oldPassword, newPassword, newPasswordRepeat } = req.body;

    if (!oldPassword || !newPassword || !newPasswordRepeat) {
      res
        .status(400)
        .json({ message: "გთხოვთ, შეიყვანოთ ძველი და ახალი პაროლი" });
      return;
    }
    if (oldPassword === newPassword) {
      res
        .status(400)
        .json({ message: "ახალი პაროლი უნდა განსხვავდებოდეს ძველისგან" });
      return;
    }
    if (newPassword !== newPasswordRepeat) {
      res
        .status(400)
        .json({ message: "შეყვანილი პაროლები არ ემთხვევა ერთმანეთს" });
      return;
    }

    const passwordRegex =
      /^[A-Z](?=.*\d)(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,24}$/;
    if (!passwordRegex.test(newPassword)) {
      res.status(400).json({
        message:
          "პაროლი: მინ. 8 სიმბოლო, პირველი დიდი ასო, მინიმუმ 1 ციფრი და სპეც. სიმბოლო",
      });
      return;
    }

    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ message: "მომხმარებელი ვერ მოიძებნა" });
      return;
    }

    if (!(await bcrypt.compare(oldPassword, user.password))) {
      res.status(400).json({ message: "ძველი პაროლი არასწორია" });
      return;
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "პაროლი წარმატებით განახლდა" });
  } catch (error) {
    res.status(500).json({ message: "სერვერზე შეცდომა" });
  }
};
