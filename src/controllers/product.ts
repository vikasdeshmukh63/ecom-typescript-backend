// imports
import { NextFunction, Request, Response } from 'express';
import { TryCatch } from '../middlewares/error.js';
import {
  BaseQueryType,
  NewProductRequestBody,
  SearchRequestQuery,
} from '../types/type.js';
import { Product } from '../models/product.js';
import ErrorHandler from '../utils/utility-class.js';
import { rm } from 'fs';
import mongoose from 'mongoose';
// import { faker } from '@faker-js/faker';

// ! controller to create new product
export const newProduct = TryCatch(
  async (
    req: Request<{}, {}, NewProductRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    // extracting data from request body
    const { category, name, price, stock } = req.body;
    const photo = req.file;

    // checking if photo is provided
    if (!photo) {
      return next(new ErrorHandler('Photo is required', 400));
    }

    // checking if all fields are provided
    if (!name || !price || !stock || !category) {
      // if fields are not provided but photo is provided then deleting saved photo
      rm(photo.path, () => {
        console.log('photo deleted');
      });

      return next(new ErrorHandler('All fields are required', 400));
    }

    // creating new product
    await Product.create({
      name,
      price,
      stock,
      category: category.toLowerCase(),
      photo: photo?.path,
    });

    // returning response
    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
    });
  }
);

// ! controller to get latest products
export const getLatestProducts = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    // finding latest products
    const products = await Product.find({}).sort({ createdAt: -1 }).limit(5);

    // returning response
    return res.status(200).json({
      success: true,
      products,
    });
  }
);

// ! controller to get all categories
export const getAllCategories = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    // finding all categories with distinct it will return all the categories without repeating same category
    const categories = await Product.distinct('category');

    // returning response
    return res.status(200).json({
      success: true,
      categories,
    });
  }
);

// ! controller to get admin products
export const getAdminProducts = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    // finding all products
    const products = await Product.find({});

    // returning response
    return res.status(200).json({
      success: true,
      products,
    });
  }
);

// ! controller to get single product
export const getSingleProduct = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    // checking if product id is valid
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new ErrorHandler('Invalid Product ID', 404));
    }

    // finding product by id
    const product = await Product.findById(req.params.id);

    // checking if product is found
    if (!product) {
      return next(new ErrorHandler('Product not Found', 404));
    }

    // returning response
    return res.status(200).json({
      success: true,
      product,
    });
  }
);

// ! controller to update a product
export const updateProduct = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    // getting required data from request
    const { id } = req.params;
    const { name, price, stock, category } = req.body;
    const photo = req.file;

    // checking if product id is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ErrorHandler('Invalid Product ID', 404));
    }

    // finding product by id
    const product = await Product.findById(id);

    // checking if product is found
    if (!product) {
      return next(new ErrorHandler('Product not Found', 404));
    }

    // deleting old photo and saving new photo
    if (photo) {
      rm(product.photo, () => {
        console.log('Old Photo Deleted');
      });
      product.photo = photo.path;
    }

    // updating products fields
    if (name) product.name = name;
    if (price) product.price = price;
    if (stock) product.stock = stock;
    if (category) product.category = category.toLowerCase();

    // saving updated product
    await product.save();

    // returning response
    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
    });
  }
);

// ! controller to delete a product
export const deleteProduct = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    // checking if product id is valid
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new ErrorHandler('Invalid Product ID', 404));
    }

    // finding product by id
    const product = await Product.findById(req.params.id);

    // checking if product is found
    if (!product) {
      return next(new ErrorHandler('Product Not Found', 404));
    }

    // deleting photo
    rm(product.photo, () => {
      console.log('Product Photo Deleted');
    });

    // deleting product
    await product.deleteOne();

    // returning response
    return res.status(200).json({
      success: true,
      message: 'Product Deleted Successfully',
    });
  }
);

// ! controller to get all products with filter
export const getAllProducts = TryCatch(
  async (
    req: Request<{}, {}, {}, SearchRequestQuery>,
    res: Response,
    next: NextFunction
  ) => {
    // extracting data from request query
    const { category, price, search, sort } = req.query;

    // setting default values
    const page = Number(req.query.page) || 1;
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = (page - 1) * limit;

    // setting base query
    const baseQuery: BaseQueryType = {};

    // adding search query
    if (search) {
      baseQuery.name = {
        $regex: search,
        $options: 'i',
      };
    }

    // adding price query
    if (price) {
      baseQuery.price = { $lte: Number(price) };
    }

    // adding category query
    if (category) {
      baseQuery.category = category;
    }

    // finding products with filter
    const productPromise = Product.find(baseQuery)
      .sort(sort && { price: sort === 'asc' ? 1 : -1 })
      .limit(limit)
      .skip(skip);

    // to run both the queries simultaneously
    const [products, filteredOnlyProduct] = await Promise.all([
      productPromise,
      // finding products without limit and sort
      Product.find(baseQuery),
    ]);

    // calculating total page
    const totalPage = Math.ceil(filteredOnlyProduct.length / limit);

    // returning response
    return res.status(200).json({
      success: true,
      products,
      totalPage,
    });
  }
);

// const genereateRandomProducts = async (count: number = 10) => {
//   const products = [];

//   for (let i = 0; i < count; i++) {
//     const product = {
//       name: faker.commerce.productName(),
//       photo: faker.image.url(),
//       price: faker.commerce.price({ min: 1500, max: 80000, dec: 0 }),
//       stock: faker.commerce.price({ min: 0, max: 100, dec: 0 }),
//       category: faker.commerce.department(),
//       createdAt: new Date(faker.date.past()),
//       updatedAt: new Date(faker.date.recent()),
//       __v: 0,
//     };

//     products.push(product);
//   }

//   await Product.create(products);

//   console.log({ success: true });
// };

// genereateRandomProducts(20);

// const deleteRandomProduct = async(count:number = 10)=>{
//   const products = await Product.find({}).skip(4);

//   for(let i=0;i<products.length;i++){
//     const product = products[i];
//     await product.deleteOne();
//   }

//   console.log({success:true});
// }

// deleteRandomProduct()
