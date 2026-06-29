// controllers/authController.js
import jwt from "jsonwebtoken";
import { User } from "../models/UserModel.js";
import { RefreshToken } from "../models/refreshTokens.js";
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/authUtils.js";

export async function login(req, res) {
  try {
    // Extract email and password from the request body
    const { email, password } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare the provided password with the hashed password in the database
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!user.emailVerified) {
      return res.status(401).json({ message: "Invalid emailVerified " });
    }
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    //await RefreshToken.deleteMany({ userId: user._id });  // ანუუ აქ ძველი refreshtokenebi იშლეება კონკრეტული მომხმარებლის
    //და თუ გვინდა რომ რამდენიმე მოწყობილობაზე ერთდროულად შეეძლოს შესვლა მაშინ ეს არ გვჭირდება
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const newRefreshToken = new RefreshToken({
      token: refreshToken,
      userId: user._id,
    });
    await newRefreshToken.save();
    res.json({ accessToken: accessToken, refreshToken: refreshToken });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function token(req, res) {
  const refreshToken = req.body.token;
  if (refreshToken == null) {
    return res.status(401).send("Refresh token is missing or invalid.");
  }
  const existingRefreshToken = await RefreshToken.findOne({
    token: refreshToken,
  });

  if (!existingRefreshToken) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    console.log(user);
    if (err) return res.sendStatus(403);
    const accessToken = generateAccessToken(user);
    res.json({ accessToken: accessToken });
  });
}

export async function logout(req, res) {
  try {
    const refreshToken = req.body.token;

    // Check if the refresh token is provided
    if (!refreshToken) {
      return res
        .status(401)
        .json({ message: "Refresh token is missing or invalid." });
    }

    // Find and delete the refresh token from the database
    const deletedRefreshToken = await RefreshToken.findOneAndDelete({
      token: refreshToken,
    });

    // Check if the refresh token existed and was successfully deleted
    if (!deletedRefreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Successfully logged out, send response
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, newPasswordRepeat } = req.body;

    if (!newPassword || !oldPassword || !newPasswordRepeat) {
      return res
        .status(400)
        .json({ message: "გთხოვთ, შეიყვანოთ ძველი და ახალი პაროლი" });
    }
    if (oldPassword === newPassword) {
      return res
        .status(400)
        .json({ message: "ახალი პაროლი უნდა განსხვავდებოდეს ძველისგან" });
    }
    if (newPassword !== newPasswordRepeat) {
      return res
        .status(400)
        .json({ message: "შეყვანილი პაროლები არ ემთხვევა ერთმანეთს" });
    }
    const passwordRegex =
      /^[A-Z](?=.*\d)(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,24}$/;

    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          "პაროლი უნდა შეიცავდეს მინიმუმ 8 და მაქსიმუმ 25 სიმბოლოს, პირველი ასო დიდი უნდა იყოს და მინიმუმ 1 სიმბოლო.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "იუზერი არ მოიძებნა" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "ძველი პაროლი არასწორია" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();
    return res.status(200).json({ message: "პაროლი წარმატებით განახლდა" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "სერვერზე შეცდომა" });
  }
};
