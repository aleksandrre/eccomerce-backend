import { User } from "../models/UserModel.js";
export const getUserInfo = async (req, res) => {
  try {
    const userId = req.user?.id; // Check if user ID is provided by middleware
    console.log(userId);
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId).select(
      "name lastName email number address"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateUserInfo = async (req, res) => {
  try {
    const userId = req.user?.id; // Check if user ID is provided by middleware
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const { name, lastName, number, address } = req.body;

    // Validate provided fields
    if (name && typeof name !== "string") {
      return res.status(400).json({ message: "Name must be a valid string" });
    }
    if (lastName && typeof lastName !== "string") {
      return res
        .status(400)
        .json({ message: "Last name must be a valid string" });
    }
    if (number && typeof number !== "string") {
      return res.status(400).json({ message: "Number must be a valid string" });
    }
    if (address && typeof address !== "string") {
      return res
        .status(400)
        .json({ message: "Address must be a valid string" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if any fields are being updated
    const updates = {};
    if (name && name !== user.name) updates.name = name;
    if (lastName && lastName !== user.lastName) updates.lastName = lastName;
    if (number && number !== user.number) updates.number = number;
    if (address && address !== user.address) updates.address = address;

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ message: "No changes detected in user information" });
    }

    // Update fields only if there are changes
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
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
