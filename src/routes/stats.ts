// imports
import express from 'express';
import { adminOnly } from '../middlewares/auth.js';
import {
  getDashboardStats,
  getPieChartData,
  getBarChartData,
  getLineChartData,
} from '../controllers/stats.js';

// router
const app = express.Router();

// ? route to get stats
app.get('/stats', adminOnly, getDashboardStats);

// ? route to get pie charts data
app.get('/pie', adminOnly, getPieChartData);

// ? route to get bar charts data
app.get('/bar', adminOnly, getBarChartData);

// ? route to get line charts data
app.get('/line', adminOnly, getLineChartData);

export default app;
