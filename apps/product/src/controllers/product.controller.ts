import mongoose from "mongoose";
import { Request, Response } from "express";
import { Product } from "../model/product.model";
import { createProductSchema, updateProductSchema } from "../types";
import { uploadImage } from "../service/imagekit.service";

interface Filter {
  $text?: { $search: string };
  ["price.amount"]?: {
    $gte?: number;
    $lte?: number;
  };
}

interface MulterFile extends Express.Multer.File {}

// - `POST /` - Create product (seller/admin only)
export const createProduct = async (req: Request, res: Response) => {
  try {
    const parser = createProductSchema.safeParse(req.body);
    if (!parser.success)
      return res.status(400).json({
        message: "Invalid data",
        error: JSON.parse(parser.error.message).map(
          (m: any) => `${m.path}: ${m.message}`
        ),
      });

      const files = (req.files as MulterFile[]) || []

    const images = await Promise.all(
      files.map((file) => uploadImage({ buffer: file.buffer }))
    );

    const product = await Product.create({
      title: parser.data.title,
      description: parser.data.description,
      price: parser.data.price,
      seller: req.sellerId,
      images,
      stock: parser.data.stock,
    });

    return res.status(200).json({ message: "Product created", product });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create product" });
  }
};

// - `GET /` - List all products
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { q, minprice, maxprice, skip } = req.query;

    const filter: Filter = {};

    if (q && typeof q === "string") {
      filter.$text = { $search: q };
    }

    if (minprice) {
      filter["price.amount"] = {
        ...filter["price.amount"],
        $gte: Number(minprice),
      };
    }

    if (maxprice) {
      filter["price.amount"] = {
        ...filter["price.amount"],
        $lte: Number(maxprice),
      };
    }

    const products = await Product.find(filter).skip(Number(skip) || 0).limit(10);;
    if (!products.length)
      return res
        .status(200)
        .json({ message: "No products found", products: [] });

    return res.status(200).json({ message: "products found", products });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get all products" });
  }
};

// - `GET /:id` - Get product by ID
export const getProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id as string))
      return res.status(400).json({ message: "productId required." });

    const product = await Product.findById(id);
    if (!product)
      return res
        .status(404)
        .json({ message: "Product not found", product: null });

    return res.status(200).json({ message: "Product fetched", product });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get product" });
  }
};

// - `PATCH /:id` - Update product (seller only)
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parser = updateProductSchema.safeParse(req.body);

    if (!mongoose.Types.ObjectId.isValid(id as string))
      return res.status(400).json({ message: "Invalid id." });

    if (!parser.success)
      return res.status(400).json({
        message: "Invalid data.",
        error: JSON.parse(parser.error.message).map(
          (m: any) => `${m.path}: ${m.message}`
        ),
      });

    const oldData = await Product.findById(id);
    if (!oldData)
      return res
        .status(404)
        .json({ message: "Product not found.", product: null });

    const data = {
      title: parser.data.title ?? oldData.title,
      description: parser.data.description ?? oldData.description,
      price: parser.data.price ?? oldData.price,
      stock: parser.data.stock ?? oldData.stock,
    };

    const product = await Product.findByIdAndUpdate(
      id,
      { ...data },
      { new: true }
    );

    return res.status(200).json({ message: "Product updated.", product });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update product" });
  }
};

// - `DELETE /:id` - Delete product (seller only)
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id as string))
      return res.status(400).json({ message: "Invalid id." });

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found." });
    }

    return res.status(200).json({ message: "Product deleted." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete product" });
  }
};

// - `GET /seller` - Seller's products
export const getSellerProduct = async (req: Request, res: Response) => {
  try {
    const products = await Product.find({
      seller: req.sellerId,
    });

    if (!products.length)
      return res
        .status(200)
        .json({ message: "No products found", products: [] });

    return res.status(200).json({ message: "products found", products });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get products" });
  }
};

