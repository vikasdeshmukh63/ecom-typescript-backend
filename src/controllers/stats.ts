import { NextFunction, Request, Response } from 'express';
import { TryCatch } from '../middlewares/error.js';
import { myCache } from '../app.js';
import { Product } from '../models/product.js';
import { User } from '../models/user.js';
import { Order } from '../models/order.js';
import { calculatePercentage } from '../utils/features.js';

// ! controller to get dashboard stats
export const getDashboardStats = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    let stats = {};

    // checking for cached data
    if (myCache.has('admin-stats')) {
      stats = JSON.parse(myCache.get('admin-stats') as string);
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
        const monthDiff = today.getMonth() - creationDate.getMonth();

        // if order is created within last 6 months
        if (monthDiff < 6) {
          // increment count and revenue
          orderMonthCounts[6 - monthDiff - 1] += 1;
          orderMonthlyRevenue[6 - monthDiff - 1] += order.total;
        }
      });

      // counting products for each category
      const categoriesCountsPromise = categories.map((category) =>
        Product.countDocuments({ category })
      );

      // getting counts of products for each category
      const categoriesCount = await Promise.all(categoriesCountsPromise);

      // creating object with category and percentage
      const categoryCount: Record<string, number>[] = [];

      // creating object with category and percentage
      categories.forEach((category, i) => {
        categoryCount.push({
          [category]: Math.round((categoriesCount[i] / productsCount) * 100),
        });
      });

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
      myCache.set('admin-stats', JSON.stringify(stats));
    }

    return res.status(200).json({
      success: true,
      stats,
    });
  }
);

export const getPieChartData = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {}
);

export const getBarChartData = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {}
);

export const getLineChartData = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {}
);
