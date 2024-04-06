// imports
import express from 'express'
import {
  deleteUser,
  getAllUsers,
  getUser,
  newUser,
} from '../controllers/user.js'
import { adminOnly } from '../middlewares/auth.js'

// router
const app = express.Router()

// ? route to create new user
app.post('/new', newUser)

// ? route to get all users
app.get('/all', adminOnly, getAllUsers)

// ? route to get or delete particular user
app.route('/:id').get(getUser).delete(adminOnly, deleteUser)

export default app
