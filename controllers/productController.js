import { Product } from "../models/productModel.js";
import { Category } from "../models/CategoryModel.js";

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getOneProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id).populate("categories");

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Controller function to get products by category
export const getCategory = async (req, res) => {
  const { categoryName } = req.params; // Get the category name from URL parameter

  try {
    // Find the category by its name and populate its products in one step
    const category = await Category.findOne({ name: categoryName }).populate(
      "products"
    );

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Send the populated products directly as the response
    res.status(200).json(category.products);
  } catch (error) {
    // Handle errors and send a response
    console.error("Error fetching products by category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllCategoryName = async (req, res) => {
  try {
    // Fetch all categories and return only the name field

    const categories = await Category.find({}, "name"); // 'name' selects only the name field

    // If no categories are found, return an appropriate message
    if (categories.length === 0) {
      return res.status(404).json({ message: "No categories found" });
    }

    // Return the category names
    res.status(200).json(categories);
  } catch (error) {
    // Handle any errors that occur during the fetch
    res.status(500).json({ message: "Error retrieving category names", error });
  }
};
