import { Response } from "express";
import { AuthRequest } from "../../../types";
import { FoodProduct } from "../models/FoodProductModel";
import { FoodCategory } from "../models/FoodCategoryModel";
import configureMulter from "../../../shared/services/configureMulter";
import {
  uploadFilesToS3,
  deleteFilesFromS3,
} from "../../../shared/services/s3Service";

// ==================== CATEGORIES ====================

export const addFoodCategory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, description, icon, route } = req.body;

    if (await FoodCategory.findOne({ "name.en": name?.en })) {
      res.status(400).json({
        success: false,
        message: "ასეთი სახელის კატეგორია უკვე არსებობს",
      });
      return;
    }

    const category = await FoodCategory.create({
      name,
      description,
      icon,
      route,
    });
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "შეცდომა კატეგორიის შექმნისას",
      error: (error as Error).message,
    });
  }
};

export const deleteFoodCategory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const category = await FoodCategory.findByIdAndDelete(
      req.params.categoryId
    );
    if (!category) {
      res
        .status(404)
        .json({ success: false, message: "კატეგორია ვერ მოიძებნა" });
      return;
    }
    res
      .status(200)
      .json({ success: true, message: "კატეგორია წარმატებით წაიშალა" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "შეცდომა კატეგორიის წაშლისას",
      error: (error as Error).message,
    });
  }
};

// ==================== PRODUCTS ====================

export const addFoodProduct = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    await configureMulter(4)(req, res);

    const {
      name,
      categoryId,
      longDescription,
      shortDescription,
      isNewProduct,
      minKg,
      kgThreshold,
      pricePerKg,
      bulkPricePerKg,
      quantity,
    } = req.body;

    if (await FoodProduct.findOne({ "name.en": name?.en })) {
      res.status(400).json({
        success: false,
        message: "ასეთი სახელის პროდუქტი უკვე არსებობს",
      });
      return;
    }

    if (!(await FoodCategory.findById(categoryId))) {
      res
        .status(400)
        .json({ success: false, message: "კატეგორია ვერ მოიძებნა" });
      return;
    }

    const images = await uploadFilesToS3(
      req.files as Express.Multer.File[]
    );

    const product = await FoodProduct.create({
      name,
      category: categoryId,
      longDescription,
      shortDescription,
      images,
      isNewProduct: Boolean(isNewProduct),
      minKg: Number(minKg),
      kgThreshold: Number(kgThreshold),
      pricePerKg: Number(pricePerKg),
      bulkPricePerKg: Number(bulkPricePerKg),
      quantity: Number(quantity),
    });

    await FoodCategory.findByIdAndUpdate(categoryId, {
      $push: { products: product._id },
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "შეცდომა პროდუქტის შექმნისას",
      error: (error as Error).message,
    });
  }
};

export const updateFoodProduct = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    await configureMulter(4)(req, res);

    const { productId } = req.params;
    const {
      name,
      categoryId,
      shortDescription,
      longDescription,
      isNewProduct,
      minKg,
      kgThreshold,
      pricePerKg,
      bulkPricePerKg,
      quantity,
    } = req.body;

    const product = await FoodProduct.findById(productId);
    if (!product) {
      res
        .status(404)
        .json({ success: false, message: "პროდუქტი ვერ მოიძებნა" });
      return;
    }

    if (name && name?.en !== product.name?.en) {
      if (await FoodProduct.findOne({ "name.en": name.en })) {
        res.status(400).json({
          success: false,
          message: "ასეთი სახელის პროდუქტი უკვე არსებობს",
        });
        return;
      }
      product.name = name;
    }

    if (categoryId && String(categoryId) !== String(product.category)) {
      if (!(await FoodCategory.findById(categoryId))) {
        res
          .status(400)
          .json({ success: false, message: "კატეგორია ვერ მოიძებნა" });
        return;
      }
      await FoodCategory.findByIdAndUpdate(product.category, {
        $pull: { products: productId },
      });
      await FoodCategory.findByIdAndUpdate(categoryId, {
        $push: { products: productId },
      });
      product.category = categoryId;
    }

    if (shortDescription) product.shortDescription = shortDescription;
    if (longDescription) product.longDescription = longDescription;
    if (isNewProduct !== undefined)
      product.isNewProduct = Boolean(isNewProduct);
    if (minKg !== undefined) product.minKg = Number(minKg);
    if (kgThreshold !== undefined) product.kgThreshold = Number(kgThreshold);
    if (pricePerKg !== undefined) product.pricePerKg = Number(pricePerKg);
    if (bulkPricePerKg !== undefined)
      product.bulkPricePerKg = Number(bulkPricePerKg);
    if (quantity !== undefined) product.quantity = Number(quantity);

    const files = req.files as Express.Multer.File[];
    if (files?.length > 0) {
      await deleteFilesFromS3(product.images);
      product.images = await uploadFilesToS3(files);
    }

    const updated = await product.save();
    res.status(200).json({
      success: true,
      message: "პროდუქტი წარმატებით განახლდა",
      product: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "შეცდომა პროდუქტის განახლებისას",
      error: (error as Error).message,
    });
  }
};

export const deleteFoodProduct = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const product = await FoodProduct.findById(req.params.productId);
    if (!product) {
      res
        .status(404)
        .json({ success: false, message: "პროდუქტი ვერ მოიძებნა" });
      return;
    }

    await deleteFilesFromS3(product.images);
    await FoodCategory.findByIdAndUpdate(product.category, {
      $pull: { products: product._id },
    });
    await product.deleteOne();

    res
      .status(200)
      .json({ success: true, message: "პროდუქტი წარმატებით წაიშალა" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "შეცდომა პროდუქტის წაშლისას",
      error: (error as Error).message,
    });
  }
};
