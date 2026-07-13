import { createProductReadController } from "../../../shared/factories/productReadFactory";
import { AnimalProduct } from "../models/AnimalProductModel";
import { AnimalCategory } from "../models/AnimalCategoryModel";
import { computeAnimalUnitPrice } from "../../../shared/utils/pricing";

// `.lean()` strips the discountedPrice virtual, so add it back for the client.
const withDiscountedPrice = (doc: Record<string, unknown>) => {
  if (typeof doc.price === "number" && typeof doc.sale === "number") {
    doc.discountedPrice = computeAnimalUnitPrice({
      price: doc.price,
      sale: doc.sale,
    });
  }
  return doc;
};

const controller = createProductReadController(
  AnimalProduct,
  AnimalCategory,
  withDiscountedPrice
);

export const getAllAnimalProducts = controller.getAllProducts;
export const getOneAnimalProduct = controller.getOneProduct;
export const getAnimalProductsByCategory = controller.getProductsByCategory;
export const getAllAnimalCategories = controller.getAllCategories;
