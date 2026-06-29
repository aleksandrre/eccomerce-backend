import mongoose from "mongoose";

const colorSchema = new mongoose.Schema(
  {
    colorName: {
      type: String,
      required: true,
    },
    colorPrice: {
      type: Number,
      min: 0,
      default: function () {
        return this.parent().mainPrice;
      },
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    sale: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    image: {
      type: String,
      required: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

colorSchema.virtual("discountedPrice").get(function () {
  return Number(
    (this.colorPrice - (this.colorPrice * this.sale) / 100).toFixed(2)
  );
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
      },
    ],
    longDescription: {
      type: String,

      required: true,
    },
    shortDescription: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      required: true,
    },
    mainPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    isNewProduct: {
      type: Boolean,
      default: false,
    },
    sale: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    isTopSale: {
      type: Boolean,
      default: false,
    },
    colors: [colorSchema],
    simpleQuantity: {
      type: Number,
      min: 0,
      required: function () {
        return !this.colors || this.colors.length === 0;
      },
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual("discountedPrice").get(function () {
  return Number(
    (this.mainPrice - (this.mainPrice * this.sale) / 100).toFixed(2)
  );
});

productSchema.virtual("quantity").get(function () {
  if (!this.colors || this.colors.length === 0) {
    return this.simpleQuantity;
  }
  return this.colors.reduce((total, color) => total + color.quantity, 0);
});

export const Product = mongoose.model("Product", productSchema);
