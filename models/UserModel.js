import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    // ფერთან დაკავშირებული ველები optional არის
    colorId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    colorName: String,
    image: String,
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    sale: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
cartItemSchema.virtual("discountedPrice").get(function () {
  return Number((this.price - (this.price * this.sale) / 100).toFixed(2));
});
// კონკრეტული პროდუქტის ჯამური ფასი (რაოდენობა × ფასდაკლებული ფასი)
cartItemSchema.virtual("totalPrice").get(function () {
  return Number((this.discountedPrice * this.quantity).toFixed(2));
});

const wishListSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  // ფერთან დაკავშირებული ველები optional არის
  colorId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  colorName: String,
  image: String,
  price: {
    type: Number,
    required: true,
  },
  sale: {
    type: Number,
    required: true,
    default: 0,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    number: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      type: String,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    emailVerified: {
      type: Boolean,
      default: false,
    },
    resetToken: String,
    resetTokenExpires: Date,
    cart: [cartItemSchema],
    wishList: [wishListSchema],
    createdAt: {
      type: Date,
      default: Date.now, // Sets the current date when the document is created
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// კალათის სტატისტიკის ვირტუალური ველები
userSchema.virtual("cartTotal").get(function () {
  if (!this.cart || this.cart.length === 0) return 0;
  return Number(
    this.cart
      .reduce((total, item) => {
        return total + item.totalPrice;
      }, 0)
      .toFixed(2)
  );
});
userSchema.virtual("cartOriginalTotal").get(function () {
  if (!this.cart || this.cart.length === 0) return 0;
  return Number(
    this.cart
      .reduce((total, item) => {
        return total + item.price * item.quantity;
      }, 0)
      .toFixed(2)
  );
});

userSchema.virtual("cartSavings").get(function () {
  if (!this.cart || this.cart.length === 0) return 0;
  return Number((this.cartOriginalTotal - this.cartTotal).toFixed(2));
});

export const User = mongoose.model("users", userSchema);
