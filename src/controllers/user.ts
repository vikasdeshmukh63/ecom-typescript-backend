// imports
import { NextFunction, Request, Response } from 'express'
import { TryCatch } from '../middlewares/error.js'
import { User } from '../models/user.js'
import { NewUserRequestBody } from '../types/type.js'
import ErrorHandler from '../utils/utility-class.js'

// ! controller to create new user
export const newUser = TryCatch(
  async (
    req: Request<{}, {}, NewUserRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    // extracting data from the body
    const { name, email, photo, gender, role, _id, dob } = req.body

    // checking if user exists
    let user = await User.findById(_id)

    // if user exists
    if (user)
      return res.status(200).json({
        success: true,
        message: `Welcome, ${user.name}`,
      })

    // if user does not exist then checking for the fields provided
    if (!_id || !name || !email || !photo || !gender || !role || !dob) {
      return next(new ErrorHandler('Please provide all the details', 400))
    }

    // creating new user
    user = await User.create({
      name,
      email,
      photo,
      gender,
      role,
      _id,
      dob: new Date(dob),
    })

    // returning response
    return res.status(201).json({
      success: true,
      message: `Welcome ${user.name}`,
    })
  }
)

// ! controller to get all users
export const getAllUsers = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const users = await User.find({})

    return res.status(200).json({
      success: true,
      users,
    })
  }
)

// ! controller to get particular user
export const getUser = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id)

    if (!user) return next(new ErrorHandler('Invalid ID', 404))

    return res.status(200).json({
      success: true,
      user,
    })
  }
)

// ! controller to delete particular user
export const deleteUser = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id)

    if (!user) return next(new ErrorHandler('Invalid ID', 404))

    await user.deleteOne()

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    })
  }
)
