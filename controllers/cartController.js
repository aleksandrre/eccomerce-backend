import { User } from "../models/UserModel.js"; // Adjust the path based on your project structure
import { Product } from "../models/productModel.js"; // Adjust the path based on your project structure

// კალათაში არსებული ყველა პროდუქტის წამოღება
export const getAllCartProducts = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch the user and populate cart products
    const user = await User.findById(userId).populate({
      path: "cart.product",
      select: "name images ", // Select only necessary fields
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "მომხმარებელი ვერ მოიძებნა", // User not found
      });
    }

    // Respond with cart details and virtual fields
    res.status(200).json({
      success: true,
      cart: user.cart, // User's cart items
      cartTotal: user.cartTotal, // Total price including discounts
      cartOriginalTotal: user.cartOriginalTotal, // Total original price without discounts
      cartSavings: user.cartSavings, // Total savings
    });
  } catch (error) {
    console.error("Error fetching cart products:", error); // Log the error
    res.status(500).json({
      success: false,
      message: "შეცდომა კალათის პროდუქტების წამოღებისას", // Error fetching cart products
      error: error.message,
    });
  }
};

// კალათაში პროდუქტის დამატება
export const addToCart = async (req, res) => {
  try {
    const { quantity = 1, colorId = null, productId } = req.body;
    const userId = req.user.id;

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

    let cartItem = {
      product: productId,
      quantity,
    };

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

      if (selectedColor.quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: "მითითებული რაოდენობა არ არის მარაგში",
        });
      }

      cartItem = {
        ...cartItem,
        colorId: selectedColor._id,
        colorName: selectedColor.colorName,
        image: selectedColor.image,
        price: selectedColor.colorPrice || product.mainPrice,
        sale: selectedColor.sale || 0,
      };
    } else {
      if (product.simpleQuantity < quantity) {
        return res.status(400).json({
          success: false,
          message: "მითითებული რაოდენობა არ არის მარაგში",
        });
      }
      console.log();
      cartItem = {
        ...cartItem,
        price: product.mainPrice,
        sale: product.sale,
        image: product.images[0],
      };
    }

    if (!user.cart) {
      user.cart = [];
    }

    const existingItemIndex = user.cart.findIndex((item) => {
      const selectedColor = product.colors.id(colorId);

      if (colorId && selectedColor) {
        return (
          item.product.toString() === productId &&
          item.colorId?.toString() === colorId
        );
      }
      return item.product.toString() === productId;
    });

    if (existingItemIndex > -1) {
      user.cart[existingItemIndex].quantity += quantity;
    } else {
      user.cart.push(cartItem);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "პროდუქტი წარმატებით დაემატა კალათაში",
      cart: user.cart,
    });
  } catch (error) {
    console.error("Cart Addition Error:", error);
    res.status(500).json({
      success: false,
      message: "შეცდომა კალათაში დამატებისას",
      error: error.message,
    });
  }
};

// კონკრეტული პროდუქტის წაშლა კალათიდან
export const deleteFromCart = async (req, res) => {
  try {
    // const { productId } = req.params;
    const { colorId = null, productId } = req.body; // გადმოვიტანოთ colorId body-დან

    const userId = req.user.id;

    // ვპოულობთ იუზერს
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "მომხმარებელი ვერ მოიძებნა",
      });
    }

    // ვპოულობთ პროდუქტს კალათაში
    const cartItemIndex = user.cart.findIndex((item) => {
      if (colorId) {
        return (
          item.product.toString() === productId &&
          item.colorId?.toString() === colorId
        );
      }
      return item.product.toString() === productId;
    });

    if (cartItemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "პროდუქტი კალათაში ვერ მოიძებნა",
      });
    }

    const cartItem = user.cart[cartItemIndex];

    // ვამცირებთ რაოდენობას ერთით
    cartItem.quantity -= 1;

    if (cartItem.quantity === 0) {
      // თუ რაოდენობა 0-ია, ვშლით პროდუქტს კალათიდან
      user.cart.splice(cartItemIndex, 1);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message:
        cartItem.quantity === 0
          ? "პროდუქტი წარმატებით წაიშალა კალათიდან"
          : "პროდუქტის რაოდენობა წარმატებით შემცირდა",
      remainingQuantity: cartItem.quantity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "შეცდომა კალათიდან წაშლისას",
      error: error.message,
    });
  }
};

// კალათის გასუფთავება
export const deleteAllFromCart = async (req, res) => {
  try {
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, { cart: [] });

    res.status(200).json({
      success: true,
      message: "კალათა წარმატებით გასუფთავდა",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "შეცდომა კალათის გასუფთავებისას",
      error: error.message,
    });
  }
};
