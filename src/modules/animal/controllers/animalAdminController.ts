import { Response } from "express";
import { AuthRequest } from "../../../types";
import { AnimalProduct } from "../models/AnimalProductModel";
import { AnimalCategory } from "../models/AnimalCategoryModel";
import configureMulter from "../../../shared/services/configureMulter";
import {
  uploadFilesToS3,
  deleteFilesFromS3,
} from "../../../shared/services/s3Service";

// ==================== CATEGORIES ====================

export const addAnimalCategory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, description, icon, route } = req.body;

    if (await AnimalCategory.findOne({ "name.en": name?.en })) {
      res.status(400).json({
        success: false,
        message: "ასეთი სახელის კატეგორია უკვე არსებობს",
      });
      return;
    }

    const category = await AnimalCategory.create({
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

export const deleteAnimalCategory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const category = await AnimalCategory.findByIdAndDelete(
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

export const addAnimalProduct = async (
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
      sale,
      price,
      quantity,
      packageWeight,
    } = req.body;

    if (await AnimalProduct.findOne({ "name.en": name?.en })) {
      res.status(400).json({
        success: false,
        message: "ასეთი სახელის პროდუქტი უკვე არსებობს",
      });
      return;
    }

    if (!(await AnimalCategory.findById(categoryId))) {
      res
        .status(400)
        .json({ success: false, message: "კატეგორია ვერ მოიძებნა" });
      return;
    }

    const images = await uploadFilesToS3(
      req.files as Express.Multer.File[]
    );

    const product = await AnimalProduct.create({
      name,
      category: categoryId,
      longDescription,
      shortDescription,
      images,
      isNewProduct: Boolean(isNewProduct),
      sale: Number(sale) || 0,
      price: Number(price),
      quantity: Number(quantity),
      packageWeight,
    });

    await AnimalCategory.findByIdAndUpdate(categoryId, {
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

export const updateAnimalProduct = async (
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
      sale,
      price,
      quantity,
      packageWeight,
    } = req.body;

    const product = await AnimalProduct.findById(productId);
    if (!product) {
      res
        .status(404)
        .json({ success: false, message: "პროდუქტი ვერ მოიძებნა" });
      return;
    }

    if (name && name?.en !== product.name?.en) {
      if (await AnimalProduct.findOne({ "name.en": name.en })) {
        res.status(400).json({
          success: false,
          message: "ასეთი სახელის პროდუქტი უკვე არსებობს",
        });
        return;
      }
      product.name = name;
    }

    if (categoryId && String(categoryId) !== String(product.category)) {
      if (!(await AnimalCategory.findById(categoryId))) {
        res
          .status(400)
          .json({ success: false, message: "კატეგორია ვერ მოიძებნა" });
        return;
      }
      await AnimalCategory.findByIdAndUpdate(product.category, {
        $pull: { products: productId },
      });
      await AnimalCategory.findByIdAndUpdate(categoryId, {
        $push: { products: productId },
      });
      product.category = categoryId;
    }

    if (shortDescription) product.shortDescription = shortDescription;
    if (longDescription) product.longDescription = longDescription;
    if (isNewProduct !== undefined)
      product.isNewProduct = Boolean(isNewProduct);
    if (sale !== undefined) product.sale = Number(sale);
    if (price !== undefined) product.price = Number(price);
    if (quantity !== undefined) product.quantity = Number(quantity);
    if (packageWeight) product.packageWeight = packageWeight;

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

export const deleteAnimalProduct = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const product = await AnimalProduct.findById(req.params.productId);
    if (!product) {
      res
        .status(404)
        .json({ success: false, message: "პროდუქტი ვერ მოიძებნა" });
      return;
    }

    await deleteFilesFromS3(product.images);
    await AnimalCategory.findByIdAndUpdate(product.category, {
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
