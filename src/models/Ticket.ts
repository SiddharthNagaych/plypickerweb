// models/Ticket.ts  (Mongoose example)
import { Schema, model, models, Types } from "mongoose";



const TicketSchema = new Schema<ITicket>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    subject: String,
    category: String,
    status: { type: String, default: "open" },
    messages: [
      {
        from: String,
        text: String,
        files: [{ url: String, name: String }],
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export default models.Ticket || model<ITicket>("Ticket", TicketSchema);
