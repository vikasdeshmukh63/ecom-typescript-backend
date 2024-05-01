import { NextFunction, Request, Response } from 'express';
import { TryCatch } from '../middlewares/error.js';
import { NewOrderRequestBody } from '../types/type.js';
import { Order } from '../models/order.js';
import { invalidateCache, reduceStock } from '../utils/features.js';
import ErrorHandler from '../utils/utility-class.js';
import { myCache } from '../app.js';

// ! controller to place new order (caching will be revalidate on create,update,delete product and new order)
export const newOrder = TryCatch(
  async (
    req: Request<{}, {}, NewOrderRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    // extracting fields from the body
    const {
      shippingInfo,
      orderItems,
      user,
      subtotal,
      tax,
      shippingCharges,
      discount,
      total,
    } = req.body;

    // if required fields are not provided then returning error
    if (!shippingInfo || !orderItems || !user || !subtotal || !tax || !total) {
      return next(new ErrorHandler('Please Enter All Fields', 400));
    }

    // creating new order
   const order =  await Order.create({
      shippingInfo,
      orderItems,
      user,
      subtotal,
      tax,
      shippingCharges,
      discount,
      total,
    });

    // reducing stock of the product
    await reduceStock(orderItems);

    // invalidating cache
    await invalidateCache({
      product: true,
      order: true,
      admin: true,
      userId: user,
      productId:order.orderItems.map(i=>String(i.productId))
    });

    // returning success message
    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
    });
  }
);

// ! controller to get my orders
export const myOrders = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    // getting user id from query
    const user = req.query.id as string;

    // setting key
    const key = `my-orders-${user}`;

    let orders = [];

    // getting cached data
    if (myCache.has(key)) {
      orders = JSON.parse(myCache.get(key) as string);
    }
    // getting data from database if cached is not present
    else {
      orders = await Order.find({ user });
      myCache.set(key, JSON.stringify(orders));
    }

    // returning response
    return res.status(200).json({
      success: true,
      orders,
    });
  }
);

// ! controller to get all orders (admin only)
export const allOrders = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    // setting key
    const key = 'all-orders';

    let orders = [];

    // getting cached data
    if (myCache.has(key)) {
      orders = JSON.parse(myCache.get(key) as string);
    }

    // getting data from database if cached is not present
    else {
      orders = await Order.find().populate('user', 'name'); // we dont want the user id we just want his name so we are using populate here
      myCache.set(key, JSON.stringify(orders));
    }

    // returning response
    return res.status(200).json({
      success: true,
      orders,
    });
  }
);

// ! controller to get single order
export const getSingleOrder = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    // getting order id from params
    const id = req.params.id;

    // setting key
    const key = `order-${id}`;

    let order;

    // getting cached data
    if (myCache.has(key)) {
      order = JSON.parse(myCache.get(key) as string);
    }

    // getting data from database if cached is not present
    else {
      // finding order by id
      order = await Order.findById(id).populate('user', 'name');

      // checking if order is found
      if (!order) {
        return next(new ErrorHandler('Order not found', 404));
      }

      // setting cached data
      myCache.set(key, JSON.stringify(order));
    }

    // returning response
    return res.status(200).json({
      success: true,
      order,
    });
  }
);

// ! controller to update the order
export const processOrder = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    // getting id from params
    const { id } = req.params;

    // finding order by id
    const order = await Order.findById(id);

    // checking if order is found
    if (!order) {
      return next(new ErrorHandler('Order not found', 404));
    }

    // updating order status
    switch (order.status) {
      case 'Processing':
        order.status = 'Shipped';
        break;

      case 'Shipped':
        order.status = 'Delivered';
        break;
      default:
        order.status = 'Delivered';
        break;
    }

    // saving order
    await order.save();

    // invalidating cache
    await invalidateCache({
      product: false,
      order: true,
      admin: true,
      userId: order.user,
      orderId: String(order._id),
    });

    // returning response
    return res.status(200).json({
      success: true,
      message: `Order status updated to ${order.status} successfully`,
      order,
    });
  }
);

// ! controller to delete order
export const deleteOrder = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    // getting id from params
    const { id } = req.params;

    // finding order by id
    const order = await Order.findById(id);

    // checking if order is found
    if (!order) {
      return next(new ErrorHandler('Order not found', 404));
    }

    // deleting order
    await order.deleteOne();

    // invalidating cache
    await invalidateCache({
      product: false,
      order: true,
      admin: true,
      userId: order.user,
      orderId: String(order._id),
    });

    // returning response
    return res.status(200).json({
      success: true,
      message: `Order deleted successfully`,
    });
  }
);
