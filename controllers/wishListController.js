import { User } from "../models/UserModel.js"; // Adjust the path based on your project structure
import { Product } from "../models/productModel.js";
// წისლისტში დამატების ფუნქცია
export const addToWishlist = async (req, res) => {
  try {
    const { productId, colorId } = req.params;
    const userId = req.user.id;

    // მომხმარებლის შემოწმება
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "მომხმარებელი ვერ მოიძებნა",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "პროდუქტი ვერ მოიძებნა",
      });
    }

    let wishListItem = {
      product: productId,
    };

    // ფერიანი პროდუქტის ლოგიკა
    if (product.colors?.length > 0) {
      if (!colorId) {
        return res.status(400).json({
          success: false,
          message: "ფერიანი პროდუქტისთვის აუცილებელია ფერის მითითება",
        });
      }

      const selectedColor = product.colors.id(colorId);
      if (!selectedColor) {
        return res.status(404).json({
          success: false,
          message: "მითითებული ფერი ვერ მოიძებნა",
        });
      }

      wishListItem = {
        ...wishListItem,
        colorId: selectedColor._id,
        colorName: selectedColor.colorName,
        image: selectedColor.image,
        price: selectedColor.colorPrice || product.mainPrice,
        sale: selectedColor.sale || product.sale,
      };
    } else {
      wishListItem = {
        ...wishListItem,
        price: product.mainPrice,
        sale: product.sale,
        image: product.images[0],
      };
    }

    // შევამოწმოთ აქვს თუ არა მომხმარებელს wishlist მასივი
    if (!user.wishList) {
      user.wishList = [];
    }

    // შევამოწმოთ არის თუ არა უკვე დამატებული
    const existingItem = user.wishList.find((item) => {
      if (colorId) {
        return (
          item.product.toString() === productId &&
          item.colorId?.toString() === colorId
        );
      }
      return item.product.toString() === productId;
    });

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: "პროდუქტი უკვე დამატებულია სურვილების სიაში",
      });
    }

    // დავამატოთ ახალი პროდუქტი
    user.wishList.push(wishListItem);
    await user.save();

    res.status(200).json({
      success: true,
      message: "პროდუქტი წარმატებით დაემატა სურვილების სიაში",
    });
  } catch (error) {
    console.error("Wishlist Error:", error);
    res.status(500).json({
      success: false,
      message: "შეცდომა სურვილების სიაში დამატებისას",
      error: error.message,
    });
  }
};

// წისლისტიდან წაშლის ფუნქცია
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId, colorId } = req.params;
    const userId = req.user.id;

    // მომხმარებლის შემოწმება
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "მომხმარებელი ვერ მოიძებნა",
      });
    }

    // ვპოულობთ პროდუქტის ინდექსს
    const itemIndex = user.wishList.findIndex((item) => {
      if (colorId) {
        return (
          item.product.toString() === productId &&
          item.colorId?.toString() === colorId
        );
      }
      return item.product.toString() === productId;
    });

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "პროდუქტი ვერ მოიძებნა სურვილების სიაში",
      });
    }

    // ვშლით პროდუქტს
    user.wishList.splice(itemIndex, 1);
    await user.save();

    res.status(200).json({
      success: true,
      message: "პროდუქტი წარმატებით წაიშალა სურვილების სიიდან",
    });
  } catch (error) {
    console.error("Wishlist Error:", error);
    res.status(500).json({
      success: false,
      message: "შეცდომა სურვილების სიიდან წაშლისას",
      error: error.message,
    });
  }
};

export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate({
      path: "wishList.product",
      select: "name  images", // შეგიძლიათ შეცვალოთ საჭირო ველების მიხედვით
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "მომხმარებელი ვერ მოიძებნა",
      });
    }

    // თუ wishList არ არსებობს, ვაბრუნებთ ცარიელ მასივს
    const wishList = user.wishList || [];

    res.status(200).json({
      success: true,
      wishList,
      count: wishList.length,
    });
  } catch (error) {
    console.error("Wishlist Error:", error);
    res.status(500).json({
      success: false,
      message: "შეცდომა სურვილების სიის წამოღებისას",
      error: error.message,
    });
  }
};

// მთლიანი წისლისტის წაშლა
export const clearWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "მომხმარებელი ვერ მოიძებნა",
      });
    }

    // ვასუფთავებთ wishList მასივს
    user.wishList = [];
    await user.save();

    res.status(200).json({
      success: true,
      message: "სურვილების სია წარმატებით გასუფთავდა",
    });
  } catch (error) {
    console.error("Wishlist Error:", error);
    res.status(500).json({
      success: false,
      message: "შეცდომა სურვილების სიის გასუფთავებისას",
      error: error.message,
    });
  }
};
