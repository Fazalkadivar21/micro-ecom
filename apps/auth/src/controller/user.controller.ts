import { Request, Response } from "express";
import {
  createAddressSchema,
  userLoginSchema,
  userRegisterSchema,
} from "../types";
import { User } from "../model/user.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// - `POST /register` - Register a new user
export const registerUser = async (req: Request, res: Response) => {
  try {
    const parser = userRegisterSchema.safeParse(req.body);
    if (!parser.success) {
      return res.status(400).json({
        message: "Invalid data",
        error: JSON.parse(parser.error.message).map(
          (m: any) => `${m.path}: ${m.message}`
        ),
      });
    }

    const exists = await User.find({
      $or: [{ email: parser.data.email }, { username: parser.data.username }],
    });
    if (exists)
      return res.status(400).json({ message: "User already exists." });

    const hashed = bcrypt.hash(parser.data.password, 10);

    const user = await User.create({
      fullName: parser.data.fullName,
      username: parser.data.username,
      email: parser.data.email,
      password: hashed,
      addresses: parser.data.addresses,
      role: parser.data.role,
    });

    const token = jwt.sign({ id: user._id,role: user.role }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    return res
      .status(200)
      .cookie("token", token, { httpOnly: true, secure: true })
      .json({ message: "user created", token });
  } catch (error) {
    return res.status(500).json({ message: "Failed to register user." });
  }
};

// - `POST /login` - Login and receive JWT
export const login = async (req: Request, res: Response) => {
  try {
    const parser = userLoginSchema.safeParse(req.body);
    if (!parser.success) {
      return res.status(400).json({
        message: "Invalid data",
        error: JSON.parse(parser.error.message).map(
          (m: any) => `${m.path}: ${m.message}`
        ),
      });
    }

    const user = await User.findOne({
      $or: [{ email: parser.data.email }, { username: parser.data.username }],
    }).select("+password");
    if (!user) return res.status(404).json({ message: "User does not exist." });

    const valid = bcrypt.compare(parser.data.password, user.password);
    if (!valid)
      return res
        .status(403)
        .json({ message: "Invalid email/username or password" });

    const token = jwt.sign({ id: user._id,role:user.role }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    return res
      .status(200)
      .cookie("token", token, { httpOnly: true, secure: true })
      .json({ message: "Logged in successfully", token });
  } catch (error) {
    return res.status(500).json({ message: "Failed to login." });
  }
};

// - `GET /me` - Get current logged-in user
export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.userId);

    return res.status(200).json({ message: "Data fetched.", user });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get profile." });
  }
};

// - `GET /logout` - Logout
export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("token", { httpOnly: true, secure: true });
    //TODO blacklist the incoming token
    return res.status(200).json({ message: "Logged out." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to logout." });
  }
};

// - `GET /users/me/addresses` - Get user addresses
export const getAddresses = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.userId, {
      addresses: 1,
      _id: 0,
    }).lean();

    if (!user || !user.addresses || user.addresses.length === 0) {
      return res.status(200).json({
        message: "No addresses saved yet.",
        addresses: [],
      });
    }

    return res.status(200).json({
      message: "Addresses fetched successfully.",
      addresses: user.addresses,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get addresses." });
  }
};

// - `POST /users/me/addresses` - Add address
export const addAddress = async (req: Request, res: Response) => {
  try {
    const parser = createAddressSchema.safeParse(req.body);
    if (!parser.success)
      return res
        .status(400)
        .json({
          message: "invalid data",
          error: JSON.parse(parser.error.message).map(
            (m: any) => `${m.path}: ${m.message}`
          ),
        });

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $push: {
          addresses: {
            street: parser.data.street,
            city: parser.data.city,
            state: parser.data.state,
            zip: parser.data.zip,
            country: parser.data.country,
            isDefault: parser.data.isDefault,
          },
        },
      },
      { new: true, projection: { addresses: 1, _id: 0 } }
    ).lean();
    if (!user) return res.status(404).json({ message: "user not found." });

    return res
      .status(200)
      .json({ message: "address added.", addresses: user.addresses });
  } catch (error) {
    return res.status(500).json({ message: "Failed to save address." });
  }
};

//TODO - update address (and the token exp)

// - `DELETE /users/me/addresses/:addressId` - Remove address
export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const { addressId } = req.params;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $pull: {
          addresses: {
            _id: addressId,
          },
        },
      },
      { new: true, projection: { addresses: 1, _id: 0 } }
    ).lean();
    if (!user) return res.status(404).json({ message: "user not found." });

    return res
      .status(200)
      .json({ message: "Address deleted", addresses: user.addresses });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete address." });
  }
};
