import { Router } from "express";
import { verify } from "../middleware/auth.middleware";
import {
  addAddress,
  deleteAddress,
  getAddresses,
  getMe,
  login,
  logout,
  registerUser,
} from "../controller/user.controller";

export const userRouter: Router = Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", login);

userRouter.get("/me", verify, getMe);
userRouter.get("/logout", verify, logout);
userRouter.get("/users/me/addresses", verify, getAddresses);
userRouter.post("/users/me/addresses", verify, addAddress);
userRouter.delete("/users/me/addresses/:addressId", verify, deleteAddress);
