import { FoodProduct } from "../models/FoodProductModel";
import { FoodCategory } from "../models/FoodCategoryModel";
import { createCategoryAdminController } from "../../../shared/factories/categoryAdminFactory";
import { createProductAdminController } from "../../../shared/factories/productAdminFactory";
import { parseNumber } from "../../../shared/utils/validators";

// ==================== CATEGORIES ====================

const categoryController = createCategoryAdminController(
  FoodCategory,
  FoodProduct
);
export const addFoodCategory = categoryController.addCategory;
export const deleteFoodCategory = categoryController.deleteCategory;

// ==================== PRODUCTS ====================

const productController = createProductAdminController(FoodProduct, FoodCategory, {
  buildCreateFields: (body) => ({
    minKg: parseNumber(body.minKg, "minKg", { min: 0 }),
    kgThreshold: parseNumber(body.kgThreshold, "kgThreshold", { min: 0 }),
    pricePerKg: parseNumber(body.pricePerKg, "pricePerKg", { min: 0 }),
    bulkPricePerKg: parseNumber(body.bulkPricePerKg, "bulkPricePerKg", {
      min: 0,
    }),
    quantity: parseNumber(body.quantity, "quantity", { min: 0 }),
  }),
  applyUpdateFields: (product, body) => {
    if (body.minKg !== undefined)
      product.minKg = parseNumber(body.minKg, "minKg", { min: 0 });
    if (body.kgThreshold !== undefined)
      product.kgThreshold = parseNumber(body.kgThreshold, "kgThreshold", {
        min: 0,
      });
    if (body.pricePerKg !== undefined)
      product.pricePerKg = parseNumber(body.pricePerKg, "pricePerKg", {
        min: 0,
      });
    if (body.bulkPricePerKg !== undefined)
      product.bulkPricePerKg = parseNumber(
        body.bulkPricePerKg,
        "bulkPricePerKg",
        { min: 0 }
      );
    if (body.quantity !== undefined)
      product.quantity = parseNumber(body.quantity, "quantity", { min: 0 });
  },
});

export const addFoodProduct = productController.addProduct;
export const updateFoodProduct = productController.updateProduct;
export const deleteFoodProduct = productController.deleteProduct;
