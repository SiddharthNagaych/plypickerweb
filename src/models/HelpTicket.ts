// models/HelpTicket.ts
import { model, models, Schema, Document, Types } from "mongoose";

interface IHelpTicket extends Document {
  userId: Types.ObjectId;
  name?: string;
  email?: string;
  phone?: string;
  category?: string;
  issueType?: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  attachment?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const helpDeskSchema = new Schema<IHelpTicket>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: String,
  email: String,
  phone: String,
  category: String, // e.g., Refund, Order Issue, PCash, Payment
  issueType: String, // e.g., Not received, Delayed, Wrong amount
  message: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["open", "in_progress", "resolved"], 
    default: "open" 
  },
  attachment: String // image upload URL
}, { timestamps: true });

export default models.HelpTicket || model<IHelpTicket>("HelpTicket", helpDeskSchema);