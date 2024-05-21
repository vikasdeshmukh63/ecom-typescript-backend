import mongoose from 'mongoose';
import { myCache } from '../app.js';
import { Product } from '../models/product.js';
import { InvalidateCacheProps, OrderItemType } from '../types/type.js';
import { Document } from 'mongoose';

export const connectDB = (uri: string) => {
  mongoose
    .connect(uri, {
      dbName: 'EcommerceWithTypescript',
    })
    .then((c) => console.log(`db connected to ${c.connection.host}`))
    .catch((e) => console.log(e));
};

export const invalidateCache = ({
  product,
  admin,
  order,
  userId,
  orderId,
  productId,
}: InvalidateCacheProps) => {
  if (product) {
    const productKeys: string[] = [
      'latest-products',
      'categories',
      'all-products',
    ];

    if (typeof productId === 'string') {
      productKeys.push(`product-${productId}`);
    }

    if (typeof productId === 'object') {
      productId.forEach((i) => productKeys.push(`product-${i}`));
    }

    myCache.del(productKeys);
  }
  if (order) {
    const ordersKeys: string[] = [
      'all-orders',
      `my-orders-${userId}`,
      `order-${orderId}`,
    ];

    myCache.del(ordersKeys);
  }
  if (admin) {
    myCache.del([
      'admin-stats',
      'admin-pie-charts',
      'admin-bar-charts',
      'admin-line-charts',
    ]);
  }
};

// function to reduce product stock

export const reduceStock = async (orderItems: OrderItemType[]) => {
  for (let i = 0; i < orderItems.length; i++) {
    const order = orderItems[i];

    const product = await Product.findById(order.productId);

    if (!product) {
      throw new Error('Product Not Found');
    }

    product.stock -= order.quantity;

    await product.save();
  }
};

export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
  if (lastMonth === 0) {
    return thisMonth * 100;
  }
  const percent = (thisMonth / lastMonth) * 100;

  return Number(percent.toFixed(0));
};

export const getInventories = async ({
  categories,
  productsCount,
}: {
  categories: string[];
  productsCount: number;
}) => {
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

  return categoryCount;
};

interface MyDocument extends Document {
  createdAt: Date;
  discount?: number;
  total?: number;
}

type FuncProps = {
  length: number;
  docArr: MyDocument[];
  today: Date;
  property?: 'discount' | 'total';
};

export const getChartData = ({
  length,
  docArr,
  today,
  property,
}: FuncProps) => {
  const data = new Array(length).fill(0);

  docArr.forEach((i) => {
    const creationDate = i.createdAt;

    const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

    if (monthDiff < length) {
      if (property) {
        data[length - monthDiff - 1] += i[property]!;
      } else {
        data[length - monthDiff - 1] += 1;
      }
    }
  });

  return data;
};
