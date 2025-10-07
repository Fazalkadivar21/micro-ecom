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

