// importing routes
import express from 'express';
import { errorMiddleware } from './middlewares/error.js';
import userRoutes from './routes/user.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import { connectDB } from './utils/features.js';
import NodeCache from 'node-cache';
import { config } from 'dotenv';
import morgan from 'morgan';
import paymentRoutes from "./routes/payment.js"
import dashboardRoutes from "./routes/stats.js"
import Stripe from 'stripe';
import cors from "cors"

config({
  path: './.env',
});

// port no.
const port = process.env.PORT || 4000;
// mongodb url
const mongoUri = process.env.MONGO_URI || '';
// stripe key
const stripeKey = process.env.STRIPE_KEY || '';

// connecting to database
connectDB(mongoUri);

export const stripe = new Stripe(stripeKey)

export const myCache = new NodeCache();

const app = express();

// middleware
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

// home route
app.get('/', (req, res) => {
  res.send('API is working');
});

// using routes
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/product', productRoutes);
app.use('/api/v1/order', orderRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// making the uploads folder static so that anyone can access it
app.use('/uploads', express.static('uploads'));

// error middleware
app.use(errorMiddleware);

// starting server
app.listen(port, () => {
  console.log(`server is working on http://localhost:${port}`);
});
