// imports
import { NextFunction, Request, Response } from 'express';
import ErrorHandler from '../utils/utility-class.js';
import { ControllerType } from '../types/type.js';

// error middleware
export const errorMiddleware = (
  err: ErrorHandler,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.message ||= 'Internal Server Error'; // err.message || "Internal Server Error"
  err.statusCode ||= 500;

  // sending custom error
  return res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};

// try catch wrapper function
export const TryCatch =
  (func: ControllerType) =>
  (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(func(req, res, next)).catch(next);
  };
