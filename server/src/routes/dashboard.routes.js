import express from 'express';
import { getDashboardMetrics } from '../controllers/dashboard.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/metrics', getDashboardMetrics);

export default router;