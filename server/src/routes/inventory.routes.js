import express from 'express';
import {
  getRestockQueue,
  restockProduct,
} from '../controllers/inventory.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/restock-queue', getRestockQueue);
router.patch('/restock/:productId', restockProduct);

export default router;