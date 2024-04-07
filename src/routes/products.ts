// imports
import express from 'express';
import {
  deleteProduct,
  getAdminProducts,
  getAllCategories,
  getAllProducts,
  getLatestProducts,
  getSingleProduct,
  newProduct,
  updateProduct,
} from '../controllers/product.js';
import { singleUpload } from '../middlewares/multer.js';
import { adminOnly } from '../middlewares/auth.js';

// router
const app = express.Router();

// ? route to create new product
app.post('/new', adminOnly, singleUpload, newProduct);

// ? route to get all products with filter
app.get('/all',getAllProducts);

// ? route to get latest 5 products
app.get('/latest', getLatestProducts);

// ? route to get all categories
app.get('/categories', getAllCategories);

// ? route to get all products
app.get('/admin-products',adminOnly, getAdminProducts);

// ? route to update,delete or get product the product
app
  .route('/:id')
  .get(getSingleProduct)
  .put(adminOnly,singleUpload, updateProduct)
  .delete(adminOnly,deleteProduct);

export default app;
