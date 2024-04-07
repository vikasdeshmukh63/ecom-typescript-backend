// imports
import { NextFunction, Request, Response } from 'express';
import { TryCatch } from './error.js';
import ErrorHandler from '../utils/utility-class.js';
import { User } from '../models/user.js';

// middleware to check for admin or user role
export const adminOnly = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    // getting id
    const { id } = req.query;

    // checking if id is present
    if (!id) {
      return next(
        new ErrorHandler('Please Login First to Access This Request', 401)
      );
    }

    // finding user
    const user = await User.findById(id);

    // checking if user exists
    if (!user) {
      return next(new ErrorHandler('Invalid ID', 401));
    }

    // checking if user is admin
    if (user.role !== 'admin') {
      return next(new ErrorHandler('You are not an Admin', 401));
    }

    // passing to next middleware
    next();
  }
);
