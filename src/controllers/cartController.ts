import { Response } from "express";
import { AuthRequest, ProductType } from "../types";
import { User } from "../models/UserModel";
import { FoodProduct } from "../models/FoodProductModel";
import { AnimalProduct } from "../models/AnimalProductModel";

export const getAllCartProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId).populate({
      path: "cart.product",
      select: "name images",
    });

    if (!user) {
      res.status(404).json({ success: false, message: "მომხმარებელი ვერ მოიძებნა" });
      return;
    }

    res.status(200).json({
      success: true,
      cart: user.cart,
      cartTotal: user.cartTotal,
      cartOriginalTotal: user.cartOriginalTotal,
      cartSavings: user.cartSavings,
    });
  } catch (error) {
    console.error("Error fetching cart products:", error);
    res.status(500).json({
      success: false,
      message: "შეცდომა კალათის პროდუქტების წამოღებისას",
      error: (error as Error).message,
    });
  }
};

export const addToCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, productType, quantity = 1 } = req.body as {
      productId: string;
      productType: ProductType;
      quantity: number;
    };
    const userId = req.user?.id;

    if (!productType || !["food", "animal"].includes(productType)) {
      res.status(400).json({ success: false, message: "productType უნდა იყოს 'food' ან 'animal'" });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: "მომხმარებელი ვერ მოიძებნა" });
      return;
    }

    let priceSnapshot: number;
    let saleSnapshot: number;
    let image: string | undefined;

    if (productType === "food") {
      const product = await FoodProduct.findById(productId);
      if (!product) {
        res.status(404).json({ success: false, message: "პროდუქტი ვერ მოიძებნა" });
        return;
      }

      if (quantity < product.minKg) {
        res.status(400).json({
          success: false,
          message: `მინიმალური შეკვეთის რაოდენობაა ${product.minKg} კგ`,
        });
        return;
      }

      if (quantity > product.quantity) {
        res.status(400).json({ success: false, message: "მითითებული რაოდენობა არ არის მარაგში" });
        return;
      }

      priceSnapshot = quantity < product.kgThreshold
        ? product.priceBeforeThreshold
        : product.priceAfterThreshold;
      saleSnapshot = product.sale;
      image = product.images[0];
    } else {
      const product = await AnimalProduct.findById(productId);
      if (!product) {
        res.status(404).json({ success: false, message: "პროდუქტი ვერ მოიძებნა" });
        return;
      }

      if (quantity > product.quantity) {
        res.status(400).json({ success: false, message: "მითითებული რაოდენობა არ არის მარაგში" });
        return;
      }

      priceSnapshot = product.price;
      saleSnapshot = product.sale;
      image = product.images[0];
    }

    if (!user.cart) user.cart = [];

    const existingIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId && item.productType === productType
    );

    if (existingIndex > -1) {
      user.cart[existingIndex].quantity += quantity;
      if (productType === "food") {
        const fp = await FoodProduct.findById(productId);
        if (fp) {
          const newQty = user.cart[existingIndex].quantity;
          user.cart[existingIndex].priceSnapshot = newQty < fp.kgThreshold
            ? fp.priceBeforeThreshold
            : fp.priceAfterThreshold;
        }
      }
    } else {
      user.cart.push({
        product: productId,
        productType,
        quantity,
        priceSnapshot,
        saleSnapshot,
        image,
      } as never);
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
      error: (error as Error).message,
    });
  }
};

export const deleteFromCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, productType } = req.body as { productId: string; productType: ProductType };
    const userId = req.user?.id;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: "მომხმარებელი ვერ მოიძებნა" });
      return;
    }

    const cartItemIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId && item.productType === productType
    );

    if (cartItemIndex === -1) {
      res.status(404).json({ success: false, message: "პროდუქტი კალათაში ვერ მოიძებნა" });
      return;
    }

    const cartItem = user.cart[cartItemIndex];
    cartItem.quantity -= 1;

    if (cartItem.quantity <= 0) {
      user.cart.splice(cartItemIndex, 1);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message:
        cartItem.quantity <= 0
          ? "პროდუქტი წარმატებით წაიშალა კალათიდან"
          : "პროდუქტის რაოდენობა წარმატებით შემცირდა",
      remainingQuantity: cartItem.quantity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "შეცდომა კალათიდან წაშლისას",
      error: (error as Error).message,
    });
  }
};

export const deleteAllFromCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    await User.findByIdAndUpdate(userId, { cart: [] });
    res.status(200).json({ success: true, message: "კალათა წარმატებით გასუფთავდა" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "შეცდომა კალათის გასუფთავებისას",
      error: (error as Error).message,
    });
  }
};
