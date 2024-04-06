import mongoose from 'mongoose'

export const connectDB = () => {
  mongoose
    .connect('mongodb://localhost:27017', {
      dbName: 'EcommerceWithTypescript',
    })
    .then((c) => console.log(`db connected to ${c.connection.host}`))
    .catch((e) => console.log(e))
}