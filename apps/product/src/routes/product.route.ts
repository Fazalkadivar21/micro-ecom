import { Router } from "express";
import { verify } from "../middleware/auth.middleware";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  getSellerProduct,
  updateProduct,
} from "../controllers/product.controller";

export const productRouter: Router = Router();

// - `POST /` - Create product (seller/admin only)
productRouter.post("/", verify, createProduct);

// - `GET /` - List all products
productRouter.get("/", getProducts);

// - `GET /:id` - Get product by ID
productRouter.get("/:id", getProduct);

// - `PATCH /:id` - Update product (seller only)
productRouter.patch("/", verify, updateProduct);

// - `DELETE /:id` - Delete product (seller only)
productRouter.delete("/:id", verify, deleteProduct);

// - `GET /seller` - Seller's products
productRouter.get("/seller", verify, getSellerProduct);

