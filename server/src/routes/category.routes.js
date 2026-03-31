import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect); // All category routes require auth

router.route('/').get(getCategories).post(createCategory);
router.route('/:id').patch(updateCategory).delete(deleteCategory);

export default router;