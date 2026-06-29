import { Response } from "express";
import { AuthRequest } from "../types";
import { FoodProduct } from "../models/FoodProductModel";
import { AnimalProduct } from "../models/AnimalProductModel";
import { FoodCategory } from "../models/FoodCategoryModel";
import { AnimalCategory } from "../models/AnimalCategoryModel";
import { FAQ } from "../models/FaqModel";
import configureMulter from "../services/configureMulter";
import { deleteFilesFromS3, uploadFilesToS3 } from "../services/s3Service";

// ==================== FOOD CATEGORIES ====================

export const addFoodCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, geoName, description, icon, route } = req.body;

    const existingCategory = await FoodCategory.findOne({ name });
    if (existingCategory) {
      res.status(400).json({ success: false, message: "კატეგორია ასეთი სახელით უკვე არსებობს" });
      return;
    }

    const newCategory = await FoodCategory.create({ name, geoName, description, icon, route });
    res.status(201).json({ success: true, category: newCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: "შეცდომა კატეგორიის შექმნისას", error: (error as Error).message });
  }
};

export const deleteFoodCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const category = await FoodCategory.findByIdAndDelete(categoryId);
    if (!category) {
      res.status(404).json({ success: false, message: "კატეგორია ვერ მოიძებნა" });
      return;
    }
    res.status(200).json({ success: true, message: "კატეგორია წარმატებით წაიშალა" });
  } catch (error) {
    res.status(500).json({ success: false, message: "შეცდომა კატეგორიის წაშლისას", error: (error as Error).message });
  }
};

// ==================== ANIMAL CATEGORIES ====================

export const addAnimalCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, geoName, description, icon, route } = req.body;

    const existingCategory = await AnimalCategory.findOne({ name });
    if (existingCategory) {
      res.status(400).json({ success: false, message: "კატეგორია ასეთი სახელით უკვე არსებობს" });
      return;
    }

    const newCategory = await AnimalCategory.create({ name, geoName, description, icon, route });
    res.status(201).json({ success: true, category: newCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: "შეცდომა კატეგორიის შექმნისას", error: (error as Error).message });
  }
};

export const deleteAnimalCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const category = await AnimalCategory.findByIdAndDelete(categoryId);
    if (!category) {
      res.status(404).json({ success: false, message: "კატეგორია ვერ მოიძებნა" });
      return;
    }
    res.status(200).json({ success: true, message: "კატეგორია წარმატებით წაიშალა" });
  } catch (error) {
    res.status(500).json({ success: false, message: "შეცდომა კატეგორიის წაშლისას", error: (error as Error).message });
  }
};

// ==================== FOOD PRODUCTS ====================

export const addFoodProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uploadImages = configureMulter(4);
    await uploadImages(req, res);

    const {
      name,
      categoryId,
      longDescription,
      shortDescription,
      isNewProduct,
      sale,
      isTopSale,
      minKg,
      kgThreshold,
      priceBeforeThreshold,
      priceAfterThreshold,
      quantity,
    } = req.body;

    const existingProduct = await FoodProduct.findOne({ name });
    if (existingProduct) {
      res.status(400).json({ success: false, message: "პროდუქტი ასეთი სახელით უკვე არსებობს" });
      return;
    }

    const categoryExists = await FoodCategory.findById(categoryId);
    if (!categoryExists) {
      res.status(400).json({ success: false, message: "მითითებული კატეგორია არ არსებობს" });
      return;
    }

    const files = req.files as Express.Multer.File[];
    const imageUrls = await uploadFilesToS3(files);

    const newProduct = await FoodProduct.create({
      name,
      category: categoryId,
      longDescription,
      shortDescription,
      images: imageUrls,
      isNewProduct: Boolean(isNewProduct),
      sale: Number(sale) || 0,
      isTopSale: Boolean(isTopSale),
      minKg: Number(minKg),
      kgThreshold: Number(kgThreshold),
      priceBeforeThreshold: Number(priceBeforeThreshold),
      priceAfterThreshold: Number(priceAfterThreshold),
      quantity: Number(quantity),
    });

    await FoodCategory.findByIdAndUpdate(categoryId, { $push: { products: newProduct._id } });

    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: "შეცდომა პროდუქტის შექმნისას", error: (error as Error).message });
  }
};

export const updateFoodProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const uploadImages = configureMulter(4);
    await uploadImages(req, res);

    const {
      name,
      categoryId,
      shortDescription,
      longDescription,
      sale,
      isNewProduct,
      isTopSale,
      minKg,
      kgThreshold,
      priceBeforeThreshold,
      priceAfterThreshold,
      quantity,
    } = req.body;

    const product = await FoodProduct.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: "პროდუქტი ვერ მოიძებნა" });
      return;
    }

    if (name && name !== product.name) {
      const existing = await FoodProduct.findOne({ name });
      if (existing) {
        res.status(400).json({ success: false, message: "პროდუქტი ასეთი სახელით უკვე არსებობს" });
        return;
      }
      product.name = name;
    }

    if (categoryId && categoryId !== String(product.category)) {
      const categoryExists = await FoodCategory.findById(categoryId);
      if (!categoryExists) {
        res.status(400).json({ success: false, message: "მითითებული კატეგორია არ არსებობს" });
        return;
      }
      await FoodCategory.findByIdAndUpdate(product.category, { $pull: { products: productId } });
      await FoodCategory.findByIdAndUpdate(categoryId, { $push: { products: productId } });
      product.category = categoryId;
    }

    if (shortDescription) product.shortDescription = shortDescription;
    if (longDescription) product.longDescription = longDescription;
    if (sale !== undefined) product.sale = Number(sale);
    if (isNewProduct !== undefined) product.isNewProduct = Boolean(isNewProduct);
    if (isTopSale !== undefined) product.isTopSale = Boolean(isTopSale);
    if (minKg !== undefined) product.minKg = Number(minKg);
    if (kgThreshold !== undefined) product.kgThreshold = Number(kgThreshold);
    if (priceBeforeThreshold !== undefined) product.priceBeforeThreshold = Number(priceBeforeThreshold);
    if (priceAfterThreshold !== undefined) product.priceAfterThreshold = Number(priceAfterThreshold);
    if (quantity !== undefined) product.quantity = Number(quantity);

    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      await deleteFilesFromS3(product.images);
      product.images = await uploadFilesToS3(files);
    }

    const updated = await product.save();
    res.status(200).json({ success: true, message: "პროდუქტი წარმატებით განახლდა", product: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: "შეცდომა პროდუქტის განახლებისას", error: (error as Error).message });
  }
};

export const deleteFoodProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    const product = await FoodProduct.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: "პროდუქტი ვერ მოიძებნა" });
      return;
    }

    await deleteFilesFromS3(product.images);
    await FoodCategory.findByIdAndUpdate(product.category, { $pull: { products: productId } });
    await product.deleteOne();

    res.status(200).json({ success: true, message: "პროდუქტი წარმატებით წაიშალა" });
  } catch (error) {
    res.status(500).json({ success: false, message: "შეცდომა პროდუქტის წაშლისას", error: (error as Error).message });
  }
};

// ==================== ANIMAL PRODUCTS ====================

export const addAnimalProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const uploadImages = configureMulter(4);
    await uploadImages(req, res);

    const {
      name,
      categoryId,
      longDescription,
      shortDescription,
      isNewProduct,
      sale,
      isTopSale,
      price,
      quantity,
      packageWeight,
    } = req.body;

    const existingProduct = await AnimalProduct.findOne({ name });
    if (existingProduct) {
      res.status(400).json({ success: false, message: "პროდუქტი ასეთი სახელით უკვე არსებობს" });
      return;
    }

    const categoryExists = await AnimalCategory.findById(categoryId);
    if (!categoryExists) {
      res.status(400).json({ success: false, message: "მითითებული კატეგორია არ არსებობს" });
      return;
    }

    const files = req.files as Express.Multer.File[];
    const imageUrls = await uploadFilesToS3(files);

    const newProduct = await AnimalProduct.create({
      name,
      category: categoryId,
      longDescription,
      shortDescription,
      images: imageUrls,
      isNewProduct: Boolean(isNewProduct),
      sale: Number(sale) || 0,
      isTopSale: Boolean(isTopSale),
      price: Number(price),
      quantity: Number(quantity),
      packageWeight,
    });

    await AnimalCategory.findByIdAndUpdate(categoryId, { $push: { products: newProduct._id } });

    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: "შეცდომა პროდუქტის შექმნისას", error: (error as Error).message });
  }
};

export const updateAnimalProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const uploadImages = configureMulter(4);
    await uploadImages(req, res);

    const {
      name,
      categoryId,
      shortDescription,
      longDescription,
      sale,
      isNewProduct,
      isTopSale,
      price,
      quantity,
      packageWeight,
    } = req.body;

    const product = await AnimalProduct.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: "პროდუქტი ვერ მოიძებნა" });
      return;
    }

    if (name && name !== product.name) {
      const existing = await AnimalProduct.findOne({ name });
      if (existing) {
        res.status(400).json({ success: false, message: "პროდუქტი ასეთი სახელით უკვე არსებობს" });
        return;
      }
      product.name = name;
    }

    if (categoryId && categoryId !== String(product.category)) {
      const categoryExists = await AnimalCategory.findById(categoryId);
      if (!categoryExists) {
        res.status(400).json({ success: false, message: "მითითებული კატეგორია არ არსებობს" });
        return;
      }
      await AnimalCategory.findByIdAndUpdate(product.category, { $pull: { products: productId } });
      await AnimalCategory.findByIdAndUpdate(categoryId, { $push: { products: productId } });
      product.category = categoryId;
    }

    if (shortDescription) product.shortDescription = shortDescription;
    if (longDescription) product.longDescription = longDescription;
    if (sale !== undefined) product.sale = Number(sale);
    if (isNewProduct !== undefined) product.isNewProduct = Boolean(isNewProduct);
    if (isTopSale !== undefined) product.isTopSale = Boolean(isTopSale);
    if (price !== undefined) product.price = Number(price);
    if (quantity !== undefined) product.quantity = Number(quantity);
    if (packageWeight) product.packageWeight = packageWeight;

    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      await deleteFilesFromS3(product.images);
      product.images = await uploadFilesToS3(files);
    }

    const updated = await product.save();
    res.status(200).json({ success: true, message: "პროდუქტი წარმატებით განახლდა", product: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: "შეცდომა პროდუქტის განახლებისას", error: (error as Error).message });
  }
};

export const deleteAnimalProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    const product = await AnimalProduct.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: "პროდუქტი ვერ მოიძებნა" });
      return;
    }

    await deleteFilesFromS3(product.images);
    await AnimalCategory.findByIdAndUpdate(product.category, { $pull: { products: productId } });
    await product.deleteOne();

    res.status(200).json({ success: true, message: "პროდუქტი წარმატებით წაიშალა" });
  } catch (error) {
    res.status(500).json({ success: false, message: "შეცდომა პროდუქტის წაშლისას", error: (error as Error).message });
  }
};

// ==================== FAQ ====================

export const addFAQType = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { questions, name, icon } = req.body;
    const newFAQType = new FAQ({ name, icon, questions });
    await newFAQType.save();
    res.status(201).json({ message: "FAQ Type added successfully", data: newFAQType });
  } catch (error) {
    res.status(500).json({ message: "Error adding FAQ Type", error: (error as Error).message });
  }
};

export const deleteFAQType = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { faqTypeId } = req.params;
    const faqType = await FAQ.findByIdAndDelete(faqTypeId);
    if (!faqType) {
      res.status(404).json({ message: "FAQ Type not found" });
      return;
    }
    res.status(200).json({ message: "FAQ Type and its questions deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting FAQ Type", error: (error as Error).message });
  }
};

export const addFAQQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { faqTypeId, question, answer } = req.body;
    const faqType = await FAQ.findById(faqTypeId);
    if (!faqType) {
      res.status(404).json({ message: "FAQ Type not found" });
      return;
    }
    const newQuestion = { question, answer };
    faqType.questions.push(newQuestion as never);
    await faqType.save();
    res.status(201).json({ message: "Question added successfully", data: newQuestion });
  } catch (error) {
    res.status(500).json({ message: "Error adding question", error: (error as Error).message });
  }
};

export const deleteFAQQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { faqTypeId, faqQuestionId } = req.params;
    const faqType = await FAQ.findById(faqTypeId);
    if (!faqType) {
      res.status(404).json({ message: "FAQ Type not found" });
      return;
    }
    const questionIndex = faqType.questions.findIndex(
      (q) => q._id?.toString() === faqQuestionId
    );
    if (questionIndex === -1) {
      res.status(404).json({ message: "Question not found" });
      return;
    }
    faqType.questions.splice(questionIndex, 1);
    await faqType.save();
    res.status(200).json({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting question", error: (error as Error).message });
  }
};
