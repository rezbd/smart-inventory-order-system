// server/src/models/Product.model.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    minStockThreshold: {
      type: Number,
      required: [true, 'Minimum stock threshold is required'],
      min: [0, 'Threshold cannot be negative'],
      default: 10,
    },
    status: {
      type: String,
      enum: ['Active', 'Out of Stock'],
      default: 'Active',
    },
    sku: {
      type: String,
      unique: true,
      sparse: true, // Allow null/undefined (auto-generated below)
      trim: true,
      uppercase: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Auto-generate SKU if not provided
productSchema.pre('save', function (next) {
  if (!this.sku) {
    const prefix = this.name.slice(0, 3).toUpperCase();
    const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.sku = `${prefix}-${suffix}`;
  }
  next();
});

// Virtual: is product low on stock?
productSchema.virtual('isLowStock').get(function () {
  return this.stock > 0 && this.stock < this.minStockThreshold;
});

// Auto-update status when stock changes
productSchema.pre('save', function (next) {
  if (this.isModified('stock')) {
    this.status = this.stock === 0 ? 'Out of Stock' : 'Active';
  }
  next();
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);
export default Product;