import { createProductReadController } from "../../../shared/factories/productReadFactory";
import { FoodProduct } from "../models/FoodProductModel";
import { FoodCategory } from "../models/FoodCategoryModel";

const controller = createProductReadController(FoodProduct, FoodCategory);

export const getAllFoodProducts = controller.getAllProducts;
export const getOneFoodProduct = controller.getOneProduct;
export const getFoodProductsByCategory = controller.getProductsByCategory;
export const getAllFoodCategories = controller.getAllCategories;
