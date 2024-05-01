// imports
import express from 'express';
import { adminOnly } from '../middlewares/auth.js';
import {
  allOrders,
  deleteOrder,
  getSingleOrder,
  myOrders,
  newOrder,
  processOrder,
} from '../controllers/order.js';

// router
const app = express.Router();

// ? route to create new order
app.post('/new', newOrder);

// ? route to get my order
app.get('/my', myOrders);

// ? route to get all orders
app.get('/all', adminOnly, allOrders);

// ? route to get single order
app.route('/:id').get(getSingleOrder).put(adminOnly,processOrder).delete(adminOnly,deleteOrder);

export default app;
