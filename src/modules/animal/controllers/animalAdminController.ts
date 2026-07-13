import { AnimalProduct } from "../models/AnimalProductModel";
import { AnimalCategory } from "../models/AnimalCategoryModel";
import { createCategoryAdminController } from "../../../shared/factories/categoryAdminFactory";
import { createProductAdminController } from "../../../shared/factories/productAdminFactory";
import { parseNumber } from "../../../shared/utils/validators";

// ==================== CATEGORIES ====================

const categoryController = createCategoryAdminController(
  AnimalCategory,
  AnimalProduct
);
export const addAnimalCategory = categoryController.addCategory;
export const deleteAnimalCategory = categoryController.deleteCategory;

// ==================== PRODUCTS ====================

const productController = createProductAdminController(
  AnimalProduct,
  AnimalCategory,
  {
    buildCreateFields: (body) => ({
      sale:
        body.sale !== undefined
          ? parseNumber(body.sale, "sale", { min: 0, max: 100 })
          : 0,
      price: parseNumber(body.price, "price", { min: 0 }),
      quantity: parseNumber(body.quantity, "quantity", {
        min: 0,
        integer: true,
      }),
      packageWeight: body.packageWeight,
    }),
    applyUpdateFields: (product, body) => {
      if (body.sale !== undefined)
        product.sale = parseNumber(body.sale, "sale", { min: 0, max: 100 });
      if (body.price !== undefined)
        product.price = parseNumber(body.price, "price", { min: 0 });
      if (body.quantity !== undefined)
        product.quantity = parseNumber(body.quantity, "quantity", {
          min: 0,
          integer: true,
        });
      if (body.packageWeight !== undefined)
        product.packageWeight = body.packageWeight;
    },
  }
);

export const addAnimalProduct = productController.addProduct;
export const updateAnimalProduct = productController.updateProduct;
export const deleteAnimalProduct = productController.deleteProduct;
