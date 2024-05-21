// imports
import express from 'express';
import { adminOnly } from '../middlewares/auth.js';
import {
  allCoupons,
  applyDiscount,
  createPaymentIntent,
  deleteCoupon,
  newCoupon,
} from '../controllers/payment.js';

// router
const app = express.Router();

// ? route to create payment
app.post('/create',createPaymentIntent)

// ? route to check discount
app.get('/coupon/discount', applyDiscount);

// ? route to create new coupon
app.post('/coupon/new', adminOnly, newCoupon);

// ? route to get all coupons
app.get('/coupon/all', adminOnly, allCoupons);

// ? route to delete coupon
app.delete('/coupon/:id', adminOnly, deleteCoupon);

export default app;
