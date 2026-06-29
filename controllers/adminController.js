// adminController.js
import { Product } from "../models/productModel.js";
import { Category } from "../models/CategoryModel.js"; // Adjust the path to your Category model
import { FAQ } from "../models/faqModel.js"; // Import the FAQ model

import configureMulter from "../services/configureMulter.js";
import { deleteFilesFromS3, uploadFilesToS3 } from "../services/s3Service.js";

// Controller function to add a product
export const addCategory = async (req, res) => {
  try {
    const { name, geoName, description, icon, route } = req.body;

    // ვამოწმებთ არსებობს თუ არა ასეთი კატეგორია
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "კატეგორია ასეთი სახელით უკვე არსებობს",
      });
    }

    // ვქმნით ახალ კატეგორიას
    const newCategory = await Category.create({
      name,
      geoName,
      description,
      icon,
      route,
    });

    res.status(201).json({
      success: true,
      category: newCategory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "შეცდომა კატეგორიის შექმნისას",
      error: error.message,
    });
  }
};

// 2. პროდუქტის შექმნა
export const addProduct = async (req, res) => {
  try {
    const uploadImages = configureMulter(4);
    await uploadImages(req, res);

    const {
      name,
      categories, // JSON string of category IDs
      longDescription,
      shortDescription,
      mainPrice,
      isNewProduct,
      sale,
      isTopSale,
      simpleQuantity, // თუ პროდუქტს არ აქვს ფერები
    } = req.body;

    // ვამოწმებთ არსებობს თუ არა პროდუქტი
    const existingProduct = await Product.findOne({ name });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "პროდუქტი ასეთი სახელით უკვე არსებობს",
      });
    }

    // ვამოწმებთ კატეგორიებს
    const categoryIds = JSON.parse(categories);
    const categoryExists = await Category.find({
      _id: { $in: categoryIds },
    });

    if (categoryExists.length !== categoryIds.length) {
      return res.status(400).json({
        success: false,
        message: "ერთ-ერთი მითითებული კატეგორია არ არსებობს",
      });
    }

    // სურათების ატვირთვა S3-ზე
    const imageUrls = await uploadFilesToS3(req.files);

    // პროდუქტის შექმნა
    const newProduct = await Product.create({
      name,
      categories: categoryIds,
      longDescription,
      shortDescription,
      images: imageUrls,
      mainPrice: Number(mainPrice),
      isNewProduct: Boolean(isNewProduct),
      sale: Number(sale),
      isTopSale: Boolean(isTopSale),
      simpleQuantity: simpleQuantity ? Number(simpleQuantity) : undefined,
    });

    // კატეგორიების განახლება
    await Category.updateMany(
      { _id: { $in: categoryIds } },
      { $push: { products: newProduct._id } }
    );

    res.status(201).json({
      success: true,
      product: newProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "შეცდომა პროდუქტის შექმნისას",
      error: error.message,
    });
  }
};

// 3. პროდუქტზე ფერის დამატება
export const addColorToProduct = async (req, res) => {
  try {
    const uploadImage = configureMulter(1);
    await uploadImage(req, res);

    const { colorName, colorPrice, quantity, sale, productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "პროდუქტი ვერ მოიძებნა",
      });
    }

    // სურათის ატვირთვა S3-ზე
    const imageUrls = await uploadFilesToS3([req.file]);

    // ახალი ფერის ობიექტი
    const newColor = {
      colorName,
      colorPrice, // აღარ გვჭირდება Number() რადგან სქემა თვითონ გარდაქმნის
      quantity, // აღარ გვჭირდება Number() რადგან სქემა თვითონ გარდაქმნის
      sale, // აღარ გვჭირდება Number() რადგან სქემა თვითონ გარდაქმნის
      image: imageUrls[0],
    };

    // ფერის დამატება პროდუქტზე
    product.colors.push(newColor);

    // simpleQuantity-ის წაშლა თუ დაემატა ფერი
    product.simpleQuantity = undefined;

    await product.save();

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "შეცდომა ფერის დამატებისას",
      error: error,
    });
  }
};

// 4. პროდუქტის წაშლა
export const deleteProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "პროდუქტი ვერ მოიძებნა",
      });
    }

    // ვშლით სურათებს S3-დან
    const allImages = [
      ...product.images,
      ...product.colors.map((color) => color.image),
    ];
    await deleteFilesFromS3(allImages);

    // ვშლით პროდუქტის ID-ს კატეგორიებიდან
    await Category.updateMany(
      { products: productId },
      { $pull: { products: productId } }
    );

    // ვშლით პროდუქტს
    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: "პროდუქტი წარმატებით წაიშალა",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "შეცდომა პროდუქტის წაშლისას",
      error: error.message,
    });
  }
};
// ფერის წაშლა პროდუქტიდან
export const deleteColorFromProductById = async (req, res) => {
  try {
    const { productId, colorId } = req.params;

    // პროდუქტის მოძებნა
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "პროდუქტი ვერ მოიძებნა",
      });
    }

    // ფერის მოძებნა და წაშლა
    const colorIndex = product.colors.findIndex(
      (color) => color._id.toString() === colorId
    );

    if (colorIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "ფერი ვერ მოიძებნა",
      });
    }

    // ვიღებთ წასაშლელ ფერს
    const [deletedColor] = product.colors.splice(colorIndex, 1);

    // ვშლით ფერის სურათს S3-დან
    await deleteFilesFromS3([deletedColor.image]);

    // თუ ეს იყო ბოლო ფერი, საჭიროა simpleQuantity-ის დაყენება
    if (product.colors.length === 0) {
      product.simpleQuantity = 0; // ან სხვა default მნიშვნელობა
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: "ფერი წარმატებით წაიშალა",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "შეცდომა ფერის წაშლისას",
      error: error.message,
    });
  }
};

// პროდუქტის განახლება
export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const uploadImages = configureMulter(4);
    await uploadImages(req, res);

    const {
      name,
      categories,
      shortDescription,
      longDescription,
      mainPrice,
      sale,
      isNewProduct,
      isTopSale,
      simpleQuantity,
    } = req.body;

    // პროდუქტის მოძებნა
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "პროდუქტი ვერ მოიძებნა",
      });
    }

    // სახელის შემოწმება თუ შეცვლილია
    if (name && name !== product.name) {
      const existingProduct = await Product.findOne({ name });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: "პროდუქტი ასეთი სახელით უკვე არსებობს",
        });
      }
      product.name = name;
    }

    // კატეგორიების განახლება თუ მოწოდებულია
    if (categories) {
      const categoryIds = JSON.parse(categories);
      const categoryExists = await Category.find({
        _id: { $in: categoryIds },
      });

      if (categoryExists.length !== categoryIds.length) {
        return res.status(400).json({
          success: false,
          message: "ერთ-ერთი მითითებული კატეგორია არ არსებობს",
        });
      }

      // ძველი კატეგორიებიდან პროდუქტის ID-ის წაშლა
      await Category.updateMany(
        { products: productId },
        { $pull: { products: productId } }
      );

      // ახალ კატეგორიებში პროდუქტის ID-ის დამატება
      await Category.updateMany(
        { _id: { $in: categoryIds } },
        { $push: { products: productId } }
      );

      product.categories = categoryIds;
    }

    // ტექსტური ველების განახლება
    if (shortDescription) product.shortDescription = shortDescription;
    if (longDescription) product.longDescription = longDescription;

    // რიცხვითი ველების განახლება
    if (mainPrice) product.mainPrice = Number(mainPrice);
    if (sale) product.sale = Number(sale);

    // boolean ველების განახლება
    if (isNewProduct !== undefined)
      product.isNewProduct = Boolean(isNewProduct);
    if (isTopSale !== undefined) product.isTopSale = Boolean(isTopSale);

    // simpleQuantity-ის განახლება თუ პროდუქტს არ აქვს ფერები
    if (simpleQuantity && (!product.colors || product.colors.length === 0)) {
      product.simpleQuantity = Number(simpleQuantity);
    }

    // სურათების განახლება თუ ატვირთულია ახალი
    if (req.files && req.files.length > 0) {
      // ძველი სურათების წაშლა S3-დან
      await deleteFilesFromS3(product.images);

      // ახალი სურათების ატვირთვა
      const imageUrls = await uploadFilesToS3(req.files);
      product.images = imageUrls;
    }

    const updatedProduct = await product.save();

    res.status(200).json({
      success: true,
      message: "პროდუქტი წარმატებით განახლდა",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "შეცდომა პროდუქტის განახლებისას",
      error: error.message,
    });
  }
};

// Add FAQ Type
export const addFAQType = async (req, res) => {
  try {
    const { questions, name, icon } = req.body;

    const newFAQType = new FAQ({
      name,
      icon,
      questions,
    });

    await newFAQType.save();

    res
      .status(201)
      .json({ message: "FAQ Type added successfully", data: newFAQType });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding FAQ Type", error: error.message });
  }
};

// Delete FAQ Type (with its questions)
export const deleteFAQType = async (req, res) => {
  try {
    const { faqTypeId } = req.params;

    const faqType = await FAQ.findByIdAndDelete(faqTypeId);
    if (!faqType) {
      return res.status(404).json({ message: "FAQ Type not found" });
    }

    res
      .status(200)
      .json({ message: "FAQ Type and its questions deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting FAQ Type", error: error.message });
  }
};
// Add Question to an existing FAQ Type
export const addQuestion = async (req, res) => {
  try {
    const { faqTypeId, question, answer } = req.body;

    const faqType = await FAQ.findById(faqTypeId);
    if (!faqType) {
      return res.status(404).json({ message: "FAQ Type not found" });
    }

    const newQuestion = { question, answer };
    faqType.questions.push(newQuestion);

    await faqType.save();

    res
      .status(201)
      .json({ message: "Question added successfully", data: newQuestion });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding question", error: error.message });
  }
};

// Delete Question from an existing FAQ Type
export const deleteFuqQuestion = async (req, res) => {
  try {
    const { faqTypeId, FaqQuestionId } = req.params;

    const faqType = await FAQ.findById(faqTypeId);
    console.log(faqTypeId);
    if (!faqType) {
      return res.status(404).json({ message: "FAQ Type not found" });
    }

    const questionIndex = faqType.questions.findIndex(
      (q) => q._id.toString() === FaqQuestionId
    );
    if (questionIndex === -1) {
      return res.status(404).json({ message: "Question not found" });
    }

    faqType.questions.splice(questionIndex, 1);
    await faqType.save();

    res.status(200).json({ message: "Question deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting question", error: error.message });
  }
};
