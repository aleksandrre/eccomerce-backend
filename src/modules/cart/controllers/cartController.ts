import { Response } from "express";
import { AuthRequest, ProductType } from "../../../types";
import { User, ICartItemDocument } from "../../../shared/models/UserModel";
import {
  FoodProduct,
  IFoodProductDocument,
} from "../../food/models/FoodProductModel";
import {
  AnimalProduct,
  IAnimalProductDocument,
} from "../../animal/models/AnimalProductModel";
import {
  computeFoodUnitPrice,
  computeAnimalUnitPrice,
} from "../../../shared/utils/pricing";
import { AppError } from "../../../shared/errors/AppError";
import { ErrorCode } from "../../../shared/errors/errorCodes";
import { sendSuccess } from "../../../shared/utils/apiResponse";
import { requireFields, parseNumber } from "../../../shared/utils/validators";

// ─────────────────────────── helpers ───────────────────────────

type CartProduct = IFoodProductDocument | IAnimalProductDocument;

function assertProductType(value: unknown): asserts value is ProductType {
  if (value !== "food" && value !== "animal") {
    throw AppError.badRequest(
      ErrorCode.VALIDATION_ERROR,
      "productType must be 'food' or 'animal'"
    );
  }
}

async function getCartProduct(
  productType: ProductType,
  productId: string
): Promise<CartProduct | null> {
  return productType === "food"
    ? FoodProduct.findById(productId)
    : AnimalProduct.findById(productId);
}

/** Live unit price from the current product — never trusts a stored snapshot. */
function computeLineUnitPrice(
  productType: ProductType,
  product: CartProduct,
  quantity: number
): number {
  return productType === "food"
    ? computeFoodUnitPrice(product as IFoodProductDocument, quantity)
    : computeAnimalUnitPrice(product as IAnimalProductDocument);
}

/** Validates a resulting line quantity against min-order and stock rules. */
function assertValidLineQuantity(
  productType: ProductType,
  product: CartProduct,
  totalQuantity: number
): void {
  if (totalQuantity <= 0) {
    throw AppError.badRequest(
      ErrorCode.VALIDATION_ERROR,
      "Quantity must be greater than zero"
    );
  }
  if (productType === "food") {
    const minKg = (product as IFoodProductDocument).minKg;
    if (totalQuantity < minKg) {
      throw AppError.badRequest(
        ErrorCode.BELOW_MIN_KG,
        `Minimum order for this product is ${minKg} kg`
      );
    }
  } else if (!Number.isInteger(totalQuantity)) {
    throw AppError.badRequest(
      ErrorCode.VALIDATION_ERROR,
      "Quantity must be a whole number of packages"
    );
  }
  if (totalQuantity > product.quantity) {
    throw AppError.badRequest(
      ErrorCode.INSUFFICIENT_STOCK,
      "Not enough stock available"
    );
  }
}

/**
 * Loads the user's cart and computes every line's price live from the current
 * product, plus cart-level totals and savings. This is the single source of
 * truth for cart responses. Uses manual population (grouped by productType)
 * because cart items reference two different models.
 */
async function loadCartResponse(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw AppError.notFound(ErrorCode.NOT_FOUND, "User not found");
  }

  const cart = user.cart ?? [];
  const foodIds = cart
    .filter((i) => i.productType === "food")
    .map((i) => i.product);
  const animalIds = cart
    .filter((i) => i.productType === "animal")
    .map((i) => i.product);

  const [foods, animals] = await Promise.all([
    foodIds.length
      ? FoodProduct.find({ _id: { $in: foodIds } }).select(
          "name images pricePerKg bulkPricePerKg kgThreshold quantity"
        )
      : Promise.resolve([] as IFoodProductDocument[]),
    animalIds.length
      ? AnimalProduct.find({ _id: { $in: animalIds } }).select(
          "name images price sale quantity"
        )
      : Promise.resolve([] as IAnimalProductDocument[]),
  ]);

  const foodMap = new Map(foods.map((f) => [String(f._id), f]));
  const animalMap = new Map(animals.map((a) => [String(a._id), a]));

  let cartTotal = 0;
  let cartOriginalTotal = 0;

  const items = cart.map((item) => {
    const product =
      item.productType === "food"
        ? foodMap.get(String(item.product))
        : animalMap.get(String(item.product));

    let unitPrice: number;
    let originalUnitPrice: number;

    if (!product) {
      // Product was deleted — fall back to the last stored snapshot.
      unitPrice = item.priceSnapshot;
      originalUnitPrice = item.priceSnapshot;
    } else if (item.productType === "food") {
      const fp = product as IFoodProductDocument;
      unitPrice = computeFoodUnitPrice(fp, item.quantity);
      originalUnitPrice = Number(fp.pricePerKg.toFixed(2));
    } else {
      const ap = product as IAnimalProductDocument;
      unitPrice = computeAnimalUnitPrice(ap);
      originalUnitPrice = Number(ap.price.toFixed(2));
    }

    const totalPrice = Number((unitPrice * item.quantity).toFixed(2));
    cartTotal += totalPrice;
    cartOriginalTotal += originalUnitPrice * item.quantity;

    return {
      _id: item._id,
      product: product
        ? { _id: product._id, name: product.name, images: product.images }
        : null,
      productType: item.productType,
      quantity: item.quantity,
      unitPrice,
      originalUnitPrice,
      totalPrice,
      image: item.image,
      available: Boolean(product),
    };
  });

  cartTotal = Number(cartTotal.toFixed(2));
  cartOriginalTotal = Number(cartOriginalTotal.toFixed(2));

  return {
    cart: items,
    cartTotal,
    cartOriginalTotal,
    cartSavings: Number((cartOriginalTotal - cartTotal).toFixed(2)),
  };
}

function findLineIndex(
  cart: ICartItemDocument[],
  productId: string,
  productType: ProductType
): number {
  return cart.findIndex(
    (item) =>
      item.product.toString() === productId && item.productType === productType
  );
}

// ─────────────────────────── controllers ───────────────────────────

export const getAllCartProducts = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const data = await loadCartResponse(String(req.user?.id));
  sendSuccess(res, data, "Cart fetched successfully");
};

/**
 * POST /cart/add — product page & the cart "+" button.
 * Adds `quantity` (default 1) to the existing line (`+=`). Price is recomputed
 * live for the resulting quantity.
 */
export const addToCart = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { productId, productType } = req.body;
  requireFields(req.body, ["productId", "productType"]);
  assertProductType(productType);
  const quantityToAdd = parseNumber(req.body.quantity ?? 1, "quantity");

  const user = await User.findById(req.user?.id);
  if (!user) {
    throw AppError.notFound(ErrorCode.NOT_FOUND, "User not found");
  }

  const product = await getCartProduct(productType, productId);
  if (!product) {
    throw AppError.notFound(ErrorCode.PRODUCT_NOT_FOUND, "Product not found");
  }

  const idx = findLineIndex(user.cart, productId, productType);
  const existingQty = idx > -1 ? user.cart[idx].quantity : 0;
  const newTotal = existingQty + quantityToAdd;

  assertValidLineQuantity(productType, product, newTotal);
  const unitPrice = computeLineUnitPrice(productType, product, newTotal);

  if (idx > -1) {
    user.cart[idx].quantity = newTotal;
    user.cart[idx].priceSnapshot = unitPrice;
  } else {
    user.cart.push({
      product: productId,
      productType,
      quantity: newTotal,
      priceSnapshot: unitPrice,
      image: product.images[0],
    } as unknown as ICartItemDocument);
  }

  await user.save();
  const data = await loadCartResponse(String(user._id));
  sendSuccess(res, data, "Product added to cart");
};

/**
 * PUT /cart/set-quantity — cart page quantity input (absolute set, `=`).
 * Replaces the line quantity with the exact value sent and recomputes price.
 * To remove a line entirely use DELETE /cart/remove-item.
 */
export const setCartQuantity = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { productId, productType } = req.body;
  requireFields(req.body, ["productId", "productType", "quantity"]);
  assertProductType(productType);
  const newQuantity = parseNumber(req.body.quantity, "quantity");

  const user = await User.findById(req.user?.id);
  if (!user) {
    throw AppError.notFound(ErrorCode.NOT_FOUND, "User not found");
  }

  const idx = findLineIndex(user.cart, productId, productType);
  if (idx === -1) {
    throw AppError.notFound(
      ErrorCode.CART_ITEM_NOT_FOUND,
      "Product is not in the cart"
    );
  }

  const product = await getCartProduct(productType, productId);
  if (!product) {
    throw AppError.notFound(ErrorCode.PRODUCT_NOT_FOUND, "Product not found");
  }

  assertValidLineQuantity(productType, product, newQuantity);
  user.cart[idx].quantity = newQuantity;
  user.cart[idx].priceSnapshot = computeLineUnitPrice(
    productType,
    product,
    newQuantity
  );

  await user.save();
  const data = await loadCartResponse(String(user._id));
  sendSuccess(res, data, "Cart quantity updated");
};

/**
 * DELETE /cart/remove — cart "−" button. Decrements the line quantity by 1,
 * removing the line when it reaches 0. Recomputes the (food) price live in case
 * the quantity drops back below kgThreshold.
 */
export const deleteFromCart = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { productId, productType } = req.body;
  requireFields(req.body, ["productId", "productType"]);
  assertProductType(productType);

  const user = await User.findById(req.user?.id);
  if (!user) {
    throw AppError.notFound(ErrorCode.NOT_FOUND, "User not found");
  }

  const idx = findLineIndex(user.cart, productId, productType);
  if (idx === -1) {
    throw AppError.notFound(
      ErrorCode.CART_ITEM_NOT_FOUND,
      "Product is not in the cart"
    );
  }

  const newQty = user.cart[idx].quantity - 1;
  let removed = false;

  if (newQty <= 0) {
    user.cart.splice(idx, 1);
    removed = true;
  } else {
    user.cart[idx].quantity = newQty;
    // Recompute live so a food line dropping below kgThreshold re-prices.
    const product = await getCartProduct(productType, productId);
    if (product) {
      user.cart[idx].priceSnapshot = computeLineUnitPrice(
        productType,
        product,
        newQty
      );
    }
  }

  await user.save();
  const data = await loadCartResponse(String(user._id));
  sendSuccess(
    res,
    data,
    removed ? "Item removed from cart" : "Quantity decreased"
  );
};

/**
 * DELETE /cart/remove-item — cart "🗑️" button. Deletes the whole line in one
 * request regardless of its quantity.
 */
export const removeCartItem = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { productId, productType } = req.body;
  requireFields(req.body, ["productId", "productType"]);
  assertProductType(productType);

  const user = await User.findById(req.user?.id);
  if (!user) {
    throw AppError.notFound(ErrorCode.NOT_FOUND, "User not found");
  }

  const idx = findLineIndex(user.cart, productId, productType);
  if (idx === -1) {
    throw AppError.notFound(
      ErrorCode.CART_ITEM_NOT_FOUND,
      "Product is not in the cart"
    );
  }

  user.cart.splice(idx, 1);
  await user.save();

  const data = await loadCartResponse(String(user._id));
  sendSuccess(res, data, "Item removed from cart");
};

/** DELETE /cart/clear — empties the entire cart. */
export const deleteAllFromCart = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  await User.findByIdAndUpdate(req.user?.id, { cart: [] });
  const data = await loadCartResponse(String(req.user?.id));
  sendSuccess(res, data, "Cart cleared");
};
