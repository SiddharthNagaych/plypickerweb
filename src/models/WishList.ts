import mongoose, { Schema, model, models } from "mongoose";

const wishlistSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true }
);

const Wishlist = models.Wishlist || model("Wishlist", wishlistSchema);
export default Wishlist;
