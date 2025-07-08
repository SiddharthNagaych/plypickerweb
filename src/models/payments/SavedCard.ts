import { model, models, Schema } from "mongoose";

const savedCardSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  cardType: String,
  cardLast4: String,
  cardHolderName: String,
  expiry: String,
  tokenRef: String, // Cashfree token or encrypted ref
}, { timestamps: true });

export default models.SavedCard || model("SavedCard", savedCardSchema);
