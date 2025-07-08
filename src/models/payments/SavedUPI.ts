import { model, models, Schema } from "mongoose";

const savedUPISchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  upiId: String,
  displayName: String,
}, { timestamps: true });

export default models.SavedUPI || model("SavedUPI", savedUPISchema);
