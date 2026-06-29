import { Response } from "express";
import { AuthRequest, ProductType } from "../../../types";
import { User } from "../../../shared/models/UserModel";
import { FoodProduct } from "../../food/models/FoodProductModel";
import { AnimalProduct } from "../../animal/models/AnimalProductModel";

export const getAllCartProducts = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).populate({
      path: "cart.product",
      select: "name images",
    });

    if (!user) {
      res
        .status(404)
        .json({ success: false, message: "მომხმარებელი ვერ მოიძებნა" });
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
    res.status(500).json({
      success: false,
      message: "შეცდომა კალათის წამოღებისას",
      error: (error as Error).message,
    });
  }
};

export const addToCart = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      productId,
      productType,
      quantity = 1,
    } = req.body as {
      productId: string;
      productType: ProductType;
      quantity: number;
    };

    if (!["food", "animal"].includes(productType)) {
      res.status(400).json({
        success: false,
        message: "productType უნდა იყოს 'food' ან 'animal'",
      });
      return;
    }

    const user = await User.findById(req.user?.id);
    if (!user) {
      res
        .status(404)
        .json({ success: false, message: "მომხმარებელი ვერ მოიძებნა" });
      return;
    }

    let priceSnapshot: number;
    let image: string | undefined;

    if (productType === "food") {
      const product = await FoodProduct.findById(productId);
      if (!product) {
        res
          .status(404)
          .json({ success: false, message: "პროდუქტი ვერ მოიძებნა" });
        return;
      }
      if (quantity < product.minKg) {
        res.status(400).json({
          success: false,
          message: `მინიმალური შეკვეთა: ${product.minKg} კგ`,
        });
        return;
      }
      if (quantity > product.quantity) {
        res
          .status(400)
          .json({ success: false, message: "საკმარისი მარაგი არ არის" });
        return;
      }
      // ფასი განისაზღვრება kgThreshold-ის მიხედვით — sale % არ გამოიყენება
      priceSnapshot =
        quantity >= product.kgThreshold
          ? product.bulkPricePerKg
          : product.pricePerKg;
      image = product.images[0];
    } else {
      const product = await AnimalProduct.findById(productId);
      if (!product) {
        res
          .status(404)
          .json({ success: false, message: "პროდუქტი ვერ მოიძებნა" });
        return;
      }
      if (quantity > product.quantity) {
        res
          .status(400)
          .json({ success: false, message: "საკმარისი მარაგი არ არის" });
        return;
      }
      // ცხოველის საჭმელისთვის discountedPrice ვიყენებთ
      priceSnapshot = product.discountedPrice;
      image = product.images[0];
    }

    if (!user.cart) user.cart = [];

    const existingIndex = user.cart.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.productType === productType
    );

    if (existingIndex > -1) {
      user.cart[existingIndex].quantity += quantity;
      // food-ისთვის ფასი შესაძლოა შეიცვალოს threshold-ის გადაკვეთისას
      if (productType === "food") {
        const fp = await FoodProduct.findById(productId);
        if (fp) {
          const newQty = user.cart[existingIndex].quantity;
          user.cart[existingIndex].priceSnapshot =
            newQty >= fp.kgThreshold ? fp.bulkPricePerKg : fp.pricePerKg;
        }
      }
    } else {
      user.cart.push({
        product: productId,
        productType,
        quantity,
        priceSnapshot,
        image,
      } as never);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "პროდუქტი კალათაში დაემატა",
      cart: user.cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "შეცდომა კალათაში დამატებისას",
      error: (error as Error).message,
    });
  }
};

export const deleteFromCart = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { productId, productType } = req.body as {
      productId: string;
      productType: ProductType;
    };

    const user = await User.findById(req.user?.id);
    if (!user) {
      res
        .status(404)
        .json({ success: false, message: "მომხმარებელი ვერ მოიძებნა" });
      return;
    }

    const idx = user.cart.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.productType === productType
    );

    if (idx === -1) {
      res
        .status(404)
        .json({ success: false, message: "პროდუქტი კალათაში არ არის" });
      return;
    }

    user.cart[idx].quantity -= 1;
    const remaining = user.cart[idx].quantity;

    if (remaining <= 0) {
      user.cart.splice(idx, 1);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message:
        remaining <= 0
          ? "პროდუქტი კალათიდან წაიშალა"
          : "რაოდენობა შემცირდა",
      remainingQuantity: Math.max(remaining, 0),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "შეცდომა კალათიდან წაშლისას",
      error: (error as Error).message,
    });
  }
};

export const deleteAllFromCart = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    await User.findByIdAndUpdate(req.user?.id, { cart: [] });
    res
      .status(200)
      .json({ success: true, message: "კალათა გასუფთავდა" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "შეცდომა კალათის გასუფთავებისას",
      error: (error as Error).message,
    });
  }
};
