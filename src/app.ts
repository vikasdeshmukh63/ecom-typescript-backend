// importing routes
import express from 'express';
import { errorMiddleware } from './middlewares/error.js';
import userRoutes from './routes/user.js';
import productRoutes from './routes/products.js';
import { connectDB } from './utils/features.js';

// port no.
const port = 4000;

// connecting to database
connectDB();

const app = express();

// middleware
app.use(express.json());

// home route
app.get('/', (req, res) => {
  res.send('API is working');
});

// using routes
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/product', productRoutes);

// making the uploads folder static so that anyone can access it
app.use('/uploads', express.static('uploads'));

// error middleware
app.use(errorMiddleware);

// starting server
app.listen(port, () => {
  console.log(`server is working on http://localhost:${port}`);
});
