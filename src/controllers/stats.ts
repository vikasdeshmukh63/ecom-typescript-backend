import { NextFunction, Request, Response } from 'express';
import { myCache } from '../app.js';
import { TryCatch } from '../middlewares/error.js';
import { Order } from '../models/order.js';
import { Product } from '../models/product.js';
import { User } from '../models/user.js';
import {
  calculatePercentage,
  getChartData,
  getInventories,
} from '../utils/features.js';

// ! controller to get dashboard stats
export const getDashboardStats = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    let stats = {};

    const key = 'admin-stats';

    // checking for cached data
    if (myCache.has(key)) {
      stats = JSON.parse(myCache.get(key) as string);
    }

    // if cached data not present
    else {
      // getting todays date
      const today = new Date();

      // getting six month ago date
      const sixMonthAgo = new Date();
      sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);

      // current month 1st and last date
      const thisMonth = {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: today,
      };

      // last month 1st and last date
      const lastMonth = {
        start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        end: new Date(today.getFullYear(), today.getMonth() - 1, 0),
      };

      // getting products from this month
      const thisMonthProductsPromise = Product.find({
        createdAt: {
          $gte: thisMonth.start,
          $lte: thisMonth.end,
        },
      });

      // getting products from last month
      const lastMonthProductsPromise = Product.find({
        createdAt: {
          $gte: lastMonth.start,
          $lte: lastMonth.end,
        },
      });

      // getting users from this month
      const thisMonthUsersPromise = User.find({
        createdAt: {
          $gte: thisMonth.start,
          $lte: thisMonth.end,
        },
      });

      // getting users from last month
      const lastMonthUsersPromise = User.find({
        createdAt: {
          $gte: lastMonth.start,
          $lte: lastMonth.end,
        },
      });

      // getting orders from this month
      const thisMonthOrdersPromise = Order.find({
        createdAt: {
          $gte: thisMonth.start,
          $lte: thisMonth.end,
        },
      });

      // getting orders from last month
      const lastMonthOrdersPromise = Order.find({
        createdAt: {
          $gte: lastMonth.start,
          $lte: lastMonth.end,
        },
      });

      // getting last six months orders
      const lastSixMonthOrdersPromise = Order.find({
        createdAt: {
          $gte: sixMonthAgo,
          $lte: today,
        },
      });

      // getting latest transactions
      const latestTransactionPromise = Order.find({})
        .select(['orderItems', 'discount', 'total', 'status'])
        .limit(4);

      // running all the promise concurrently so that code will not get blocked
      const [
        thisMonthProducts,
        lastMonthProducts,
        thisMonthUsers,
        lastMonthUsers,
        thisMonthOrders,
        lastMonthOrders,
        productsCount,
        usersCount,
        allOrders,
        lastSixMonthOrders,
        categories,
        femaleUsersCount,
        latestTransaction,
      ] = await Promise.all([
        thisMonthProductsPromise,
        lastMonthProductsPromise,
        thisMonthUsersPromise,
        lastMonthUsersPromise,
        thisMonthOrdersPromise,
        lastMonthOrdersPromise,
        Product.countDocuments(),
        User.countDocuments(),
        Order.find({}).select('total'),
        lastSixMonthOrdersPromise,
        Product.distinct('category'),
        User.countDocuments({ gender: 'female' }),
        latestTransactionPromise,
      ]);

      // revenue of current month
      const thisMonthRevenue = thisMonthOrders.reduce(
        (total, order) => total + (order?.total || 0),
        0
      );

      // revenue of the last month
      const lastMonthRevenue = lastMonthOrders.reduce(
        (total, order) => total + (order?.total || 0),
        0
      );

      // calculating percentage for various fields
      const changePercent = {
        revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
        product: calculatePercentage(
          thisMonthProducts.length,
          lastMonthProducts.length
        ),
        user: calculatePercentage(thisMonthUsers.length, lastMonthUsers.length),
        order: calculatePercentage(
          thisMonthOrders.length,
          lastMonthOrders.length
        ),
      };

      // calculating total revenue based on the all orders
      const revenue = allOrders.reduce(
        (total, order) => total + (order?.total || 0),
        0
      );

      // count object
      const counts = {
        revenue: revenue,
        user: usersCount,
        product: productsCount,
        order: allOrders.length,
      };

      // initializing arrays of length 6 and filling them with zero
      const orderMonthCounts = new Array(6).fill(0);
      const orderMonthlyRevenue = new Array(6).fill(0);

      // populating arrays with order counts and revenue
      lastSixMonthOrders.forEach((order) => {
        // order creation date
        const creationDate = order.createdAt;
        // difference between today and order creation date
        const monthDiff =
          (today.getMonth() - creationDate.getMonth() + 12) % 12;

        // if order is created within last 6 months
        if (monthDiff < 6) {
          // increment count and revenue
          orderMonthCounts[6 - monthDiff - 1] += 1;
          orderMonthlyRevenue[6 - monthDiff - 1] += order.total;
        }
      });

      // getting category count
      const categoryCount = await getInventories({ categories, productsCount });

      // counting male and female users
      const userRatio = {
        male: usersCount - femaleUsersCount,
        female: femaleUsersCount,
      };

      // modifying latest transaction object
      const modifiedLatestTransaction = latestTransaction.map((i) => ({
        _id: i._id,
        discount: i.discount,
        amount: i.total,
        quantity: i.orderItems.length,
        status: i.status,
      }));

      // final stats object
      stats = {
        categoryCount,
        changePercent,
        counts,
        chart: {
          order: orderMonthCounts,
          revenue: orderMonthlyRevenue,
        },
        userRatio,
        latestTransaction: modifiedLatestTransaction,
      };

      // caching the data
      myCache.set(key, JSON.stringify(stats));
    }

    return res.status(200).json({
      success: true,
      stats,
    });
  }
);

// ! controller to get the pie chart data
export const getPieChartData = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    let charts;

    const key = 'admin-pie-charts';

    // checking for cached data
    if (myCache.has(key)) {
      charts = JSON.parse(myCache.get(key) as string);
    }

    // if cached data not present
    else {
      const allOrdersPromise = Order.find({}).select([
        'total',
        'discount',
        'subtotal',
        'tax',
        'shippingCharges',
      ]);

      // running all the promise concurrently so that code will not get blocked
      const [
        processingOrder,
        shippedOrder,
        deliveredOrder,
        categories,
        productsCount,
        outOfStock,
        allOrders,
        allUsers,
        adminUsers,
        customersUsers,
      ] = await Promise.all([
        Order.countDocuments({ status: 'Processing' }),
        Order.countDocuments({ status: 'Shipped' }),
        Order.countDocuments({ status: 'Delivered' }),
        Product.distinct('category'),
        Product.countDocuments(),
        Product.countDocuments({ stock: 0 }),
        allOrdersPromise,
        User.find({}).select(['role', 'dob']),
        User.countDocuments({ role: 'admin' }),
        User.countDocuments({ role: 'user' }),
      ]);

      // creating object with order fulfillment status
      const orderFulfillment = {
        processing: processingOrder,
        shipped: shippedOrder,
        delivered: deliveredOrder,
      };

      const productsCategories = await getInventories({
        categories,
        productsCount,
      });

      const stockAvailability = {
        inStock: productsCount - outOfStock,
        outOfStock,
      };

      const grossIncome = allOrders.reduce(
        (prev, order) => prev + (order.total || 0),
        0
      );

      const discount = allOrders.reduce(
        (prev, order) => prev + (order.discount || 0),
        0
      );

      const productionCost = allOrders.reduce(
        (prev, order) => prev + (order.shippingCharges || 0),
        0
      );

      const burnt = allOrders.reduce(
        (prev, order) => prev + (order.tax || 0),
        0
      );

      const marketingCost = Math.round(grossIncome * (30 / 100));

      const netMargin =
        grossIncome - marketingCost - productionCost - burnt - discount;

      const revenueDistribution = {
        netMargin,
        discount,
        productionCost,
        burnt,
        marketingCost,
      };

      const usersAgeGroup = {
        teen: allUsers.filter((i) => i.age < 20).length,
        adult: allUsers.filter((i) => i.age >= 20 && i.age < 40).length,
        old: allUsers.filter((i) => i.age >= 40).length,
      };

      const adminCustomer = {
        admin: adminUsers,
        customer: customersUsers,
      };

      const charts = {
        orderFulfillment,
        productsCategories,
        stockAvailability,
        revenueDistribution,
        adminCustomer,
        usersAgeGroup,
      };

      // caching the data
      myCache.set(key, JSON.stringify(charts));
    }

    return res.status(200).json({
      success: true,
      charts,
    });
  }
);

// ! controller to
export const getBarChartData = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    let charts;

    const key = 'admin-bar-charts';

    if (myCache.has(key)) {
      charts = JSON.parse(myCache.get(key) as string);
    } else {
      const today = new Date();

      const sixMonthAgo = new Date();
      sixMonthAgo.setMonth(today.getMonth() - 6);

      const twelveMonthAgo = new Date();
      twelveMonthAgo.setMonth(today.getMonth() - 12);

      const sixMonthProductPromise = Product.find({
        createdAt: {
          $gte: sixMonthAgo,
          $lte: today,
        },
      }).select('createdAt');

      const sixMonthUsersPromise = User.find({
        createdAt: {
          $gte: sixMonthAgo,
          $lte: today,
        },
      }).select('createdAt');

      const twelveMonthOrdersPromise = Order.find({
        createdAt: {
          $gte: twelveMonthAgo,
          $lte: today,
        },
      }).select('createdAt');

      const [products, users, orders] = await Promise.all([
        sixMonthProductPromise,
        sixMonthUsersPromise,
        twelveMonthOrdersPromise,
      ]);

      const productsCount = getChartData({
        length: 6,
        today,
        docArr: products,
      });
      const usersCount = getChartData({ length: 6, today, docArr: users });
      const ordersCount = getChartData({ length: 12, today, docArr: orders });

      charts = {
        products: productsCount,
        users: usersCount,
        orders: ordersCount,
      };

      myCache.set(key, JSON.stringify(charts));
    }

    return res.status(200).json({
      success: true,
      charts,
    });
  }
);

export const getLineChartData = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    let charts;

    const key = 'admin-line-charts';

    if (myCache.has(key)) {
      charts = JSON.parse(myCache.get(key) as string);
    } else {
      const today = new Date();

      const twelveMonthAgo = new Date();
      twelveMonthAgo.setMonth(today.getMonth() - 12);

      const baseQuery = {
        createdAt: {
          $gte: twelveMonthAgo,
          $lte: today,
        },
      };

      const [products, users, orders] = await Promise.all([
        Product.find(baseQuery).select('createdAt'),
        User.find(baseQuery).select('createdAt'),
        Order.find(baseQuery).select(['createdAt', 'discount', 'total']),
      ]);

      const productsCount = getChartData({
        length: 12,
        today,
        docArr: products,
      });
      const usersCount = getChartData({ length: 12, today, docArr: users });
      const discount = getChartData({
        length: 12,
        today,
        docArr: orders,
        property: 'discount',
      });
      const revenue = getChartData({
        length: 12,
        today,
        docArr: orders,
        property: 'total',
      });

      charts = {
        products: productsCount,
        users: usersCount,
        discount,
        revenue,
      };

      myCache.set(key, JSON.stringify(charts));
    }

    return res.status(200).json({
      success: true,
      charts,
    });
  }
);
