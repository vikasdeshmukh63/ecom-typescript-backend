import { NextFunction, Request, Response } from 'express';
import { TryCatch } from '../middlewares/error.js';
import { Coupon } from '../models/coupon.js';
import ErrorHandler from '../utils/utility-class.js';

// ! controller to create new coupon
export const newCoupon = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { coupon, amount } = req.body;

    if (!coupon || !amount) {
      next(new ErrorHandler('Please enter both coupon and amount', 400));
    }

    await Coupon.create({ code: coupon, amount });

    return res.status(201).json({
      success: true,
      message: `Coupon ${coupon} Created Successfully`,
    });
  }
);

// ! controller to apply discount
export const applyDiscount = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { coupon } = req.query;

    const discount = await Coupon.findOne({ code: coupon as string });

    if (!discount) {
      return next(new ErrorHandler('Invalid Coupon Code', 400));
    }

    return res.status(200).json({
      success: true,
      discount: discount.amount,
    });
  }
);

// ! controller to get all coupons
export const allCoupons = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const coupons = await Coupon.find();

    res.status(200).json({
      success: true,
      coupons,
    });
  }
);

// ! controller to delete coupon
export const deleteCoupon = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return next(new ErrorHandler('Coupon Not Found', 404));
    }

    return res.status(200).json({
      success: true,
      message: 'Coupon ${coupon.code} Deleted Successfully',
    });
  }
);
