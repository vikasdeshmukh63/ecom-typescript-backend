// imports
import mongoose from 'mongoose';
import validator from 'validator';

// user schema interface
interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  photo: string;
  role: 'admin' | 'user';
  gender: 'male' | 'female';
  dob: Date;
  createdAt: Date;
  updatedAt: Date;
  age: number; // virtual
}

const schema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: [true, 'Please enter ID'],
    },
    name: {
      type: String,
      required: [true, 'Please enter Name'],
    },
    email: {
      type: String,
      unique: [true, 'Email already Exist'],
      required: [true, 'Please enter your Email'],
      validate: validator.default.isEmail,
    },
    photo: {
      type: String,
      required: [true, 'Please add Photo'],
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      required: [true, 'Please enter your Gender'],
    },
    dob: {
      type: Date,
      required: [true, 'Please enter your Date of Birth'],
    },
  },
  {
    timestamps: true,
  }
);

// creating virtual field to get age
schema.virtual('age').get(function () {
  // current date
  const today = new Date();
  // users dob
  const dob = this.dob;

  // calculating age
  let age = today.getFullYear() - dob.getFullYear();

  // checking if the current month and day are before the month and day of the given date of birth. If so, it subtracts 1 from the age. Finally, it returns the age.
  if (
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
  ) {
    age--;
  }

  return age;
});

export const User = mongoose.model<IUser>('User', schema);
