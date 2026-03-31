import Category from '../models/Category.model.js';
import Product from '../models/Product.model.js';
import AppError from '../utils/AppError.js';
import { logActivity } from '../services/activityLog.service.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Attach product count to each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => ({
        ...cat,
        productCount: await Product.countDocuments({ category: cat._id }),
      }))
    );

    res.status(200).json({
      status: 'success',
      results: categoriesWithCount.length,
      data: { categories: categoriesWithCount },
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return next(new AppError('Category name is required.', 400));

    const category = await Category.create({
      name: name.trim(),
      description: description?.trim(),
      createdBy: req.user._id,
    });

    await logActivity({
      action: 'CATEGORY_CREATED',
      message: `Category "${category.name}" created.`,
      entityType: 'Category',
      entityId: category._id,
      performedBy: req.user._id,
    });

    res.status(201).json({
      status: 'success',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name: name?.trim(), description: description?.trim() },
      { new: true, runValidators: true }
    );
    if (!category) return next(new AppError('Category not found.', 404));

    await logActivity({
      action: 'CATEGORY_UPDATED',
      message: `Category updated to "${category.name}".`,
      entityType: 'Category',
      entityId: category._id,
      performedBy: req.user._id,
    });

    res.status(200).json({ status: 'success', data: { category } });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) {
      return next(
        new AppError(
          `Cannot delete: this category has ${productCount} associated product(s). Reassign or delete them first.`,
          400
        )
      );
    }

    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return next(new AppError('Category not found.', 404));

    await logActivity({
      action: 'CATEGORY_DELETED',
      message: `Category "${category.name}" deleted.`,
      entityType: 'Category',
      entityId: category._id,
      performedBy: req.user._id,
    });

    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};