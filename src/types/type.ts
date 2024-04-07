import { NextFunction, Request, Response } from 'express';

// new user request body type
export interface NewUserRequestBody {
  _id: string;
  name: string;
  email: string;
  photo: string;
  role: string;
  gender: string;
  dob: Date;
}

// new product request body type
export interface NewProductRequestBody {
  name: string;
  category: string;
  price: number;
  stock: number;
}

// controller function type
export type ControllerType = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>;

// search request query type
export type SearchRequestQuery = {
  search?: string;
  price?: string;
  category?: string;
  sort?: string;
  page?: string;
};

// base query type
export interface BaseQueryType {
  name?: {
    $regex: string;
    $options: string;
  };
  price?: { $lte: number };
  category?: string;
}
