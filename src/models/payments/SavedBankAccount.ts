import { model, models, Schema } from "mongoose";

const savedBankSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  bankName: String,
  accountNumberLast4: String,
  ifsc: String,
  holderName: String,
}, { timestamps: true });

export default models.SavedBankAccount || model("SavedBankAccount", savedBankSchema);
