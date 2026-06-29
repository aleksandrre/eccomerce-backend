import { Response } from "express";
import { AuthRequest } from "../../../types";
import { User } from "../../../shared/models/UserModel";

export const getUserInfo = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select(
      "name lastName email number address"
    );
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUserInfo = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, lastName, number, address } = req.body;

    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const updates: Partial<{
      name: string;
      lastName: string;
      number: string;
      address: string;
    }> = {};

    if (name && name !== user.name) updates.name = name;
    if (lastName && lastName !== user.lastName) updates.lastName = lastName;
    if (number && number !== user.number) updates.number = number;
    if (address && address !== user.address) updates.address = address;

    if (!Object.keys(updates).length) {
      res.status(400).json({ message: "No changes detected" });
      return;
    }

    Object.assign(user, updates);
    await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user: {
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        number: user.number,
        address: user.address,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
