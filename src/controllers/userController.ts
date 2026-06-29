import { Response } from "express";
import { AuthRequest } from "../types";
import { User } from "../models/UserModel";

export const getUserInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const user = await User.findById(userId).select("name lastName email number address");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};

export const updateUserInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const { name, lastName, number, address } = req.body;

    if (name && typeof name !== "string") {
      res.status(400).json({ message: "Name must be a valid string" });
      return;
    }
    if (lastName && typeof lastName !== "string") {
      res.status(400).json({ message: "Last name must be a valid string" });
      return;
    }
    if (number && typeof number !== "string") {
      res.status(400).json({ message: "Number must be a valid string" });
      return;
    }
    if (address && typeof address !== "string") {
      res.status(400).json({ message: "Address must be a valid string" });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const updates: Partial<{ name: string; lastName: string; number: string; address: string }> = {};
    if (name && name !== user.name) updates.name = name;
    if (lastName && lastName !== user.lastName) updates.lastName = lastName;
    if (number && number !== user.number) updates.number = number;
    if (address && address !== user.address) updates.address = address;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ message: "No changes detected in user information" });
      return;
    }

    Object.assign(user, updates);
    await user.save();

    res.status(200).json({
      message: "User information updated successfully",
      user: {
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        number: user.number,
        address: user.address,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
};
