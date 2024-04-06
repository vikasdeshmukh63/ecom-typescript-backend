import { NextFunction, Request, Response } from 'express'

// new user request body type
export interface NewUserRequestBody {
  _id: string
  name: string
  email: string
  photo: string
  role: string
  gender: string
  dob: Date
}

// controller function type 
export type ControllerType = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>
