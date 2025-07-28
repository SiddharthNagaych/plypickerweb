import mongoose, { Schema, Document, model, models } from "mongoose";

export interface ISubcategory extends Document {
  name: string;
  category: mongoose.Types.ObjectId;
  city: "Pune" | "Navi Mumbai" | "Mumbai";
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubcategorySchema = new Schema<ISubcategory>(
  {
    name: { 
      type: String, 
      required: true,
      index: true // Index for faster name queries
    },
    category: { 
      type: Schema.Types.ObjectId, 
      ref: "Category", 
      required: true,
      index: true // Index for category relationships
    },
    city: {
      type: String,
      enum: ["Pune", "Navi Mumbai", "Mumbai"],
      required: true,
      index: true // Index for city-based queries
    },
    image: { 
      type: String,
      default: ""
    }
  },
  { 
    timestamps: true, // Auto-add createdAt and updatedAt
    autoIndex: process.env.NODE_ENV !== 'production' // Auto-index in development
  }
);

// Compound indexes for common query patterns
SubcategorySchema.index({ 
  category: 1, 
  city: 1 
});

SubcategorySchema.index({ 
  name: "text" 
}, {
  weights: {
    name: 3
  }
});

// Pre-save hook for image handling
SubcategorySchema.pre('save', function(next) {
  if (!this.image) {
    this.image = `https://via.placeholder.com/300?text=${encodeURIComponent(this.name)}`;
  }
  next();
});

// Static methods
SubcategorySchema.statics.findByCity = function(city: string) {
  return this.find({ city });
};

export default models.Subcategory || model<ISubcategory>("Subcategory", SubcategorySchema);