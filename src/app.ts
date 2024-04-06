import express, { NextFunction, Request, Response } from 'express'

// importing routes
import userRoutes from './routes/user.js'
import { connectDB } from './utils/features.js'
import { errorMiddleware } from './middlewares/error.js'

const port = 4000

connectDB()

const app = express()

app.use(express.json())

app.get('/', (req, res) => {
  res.send('API is working')
})

// using routes
app.use('/api/v1/user', userRoutes)

app.use(errorMiddleware)

app.listen(port, () => {
  console.log(`server is working on http://localhost:${port}`)
})
