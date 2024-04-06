// imports
import express from 'express'
import { newUser } from '../controllers/user.js'

// router
const app = express.Router()

// ? route to create new user
app.post('/new', newUser)

export default app
