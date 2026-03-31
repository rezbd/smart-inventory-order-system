import Product from '../models/Product.model.js';
import AppError from '../utils/AppError.js';
import { logActivity } from '../services/activityLog.service.js';

export const getProducts = async (req, res, next) => {
  try {
    const { category, status, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      status: 'success',
      results: products.length,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
      data: { products },
    });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (!product) return next(new AppError('Product not found.', 404));
    res.status(200).json({ status: 'success', data: { product } });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const { name, category, price, stock, minStockThreshold, sku } = req.body;

    const product = await Product.create({
      name,
      category,
      price,
      stock,
      minStockThreshold,
      sku,
      createdBy: req.user._id,
    });

    await logActivity({
      action: 'PRODUCT_CREATED',
      message: `Product "${product.name}" (SKU: ${product.sku}) added with stock of ${stock}.`,
      entityType: 'Product',
      entityId: product._id,
      performedBy: req.user._id,
      metadata: { stock, price },
    });

    res.status(201).json({ status: 'success', data: { product } });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    // Prevent direct stock manipulation through this endpoint
    // Stock changes must go through orders or the restock endpoint
    const disallowedFields = ['stock', 'createdBy'];
    disallowedFields.forEach((field) => delete req.body[field]);

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('category', 'name');

    if (!product) return next(new AppError('Product not found.', 404));

    await logActivity({
      action: 'PRODUCT_UPDATED',
      message: `Product "${product.name}" details updated.`,
      entityType: 'Product',
      entityId: product._id,
      performedBy: req.user._id,
    });

    res.status(200).json({ status: 'success', data: { product } });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return next(new AppError('Product not found.', 404));

    await logActivity({
      action: 'PRODUCT_DELETED',
      message: `Product "${product.name}" was deleted.`,
      entityType: 'Product',
      entityId: product._id,
      performedBy: req.user._id,
    });

    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};