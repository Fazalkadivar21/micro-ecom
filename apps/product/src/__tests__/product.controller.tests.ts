import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getSellerProduct,
} from "../controllers/product.controller";
import { Product } from "../model/product.model";
import { uploadImage } from "../service/imagekit.service";
import mongoose from "mongoose";

// Mock dependencies
jest.mock("uuid", () => ({
  v4: jest.fn(() => "mock-uuid-1234"),
}));
jest.mock("../model/product.model");
jest.mock("../service/imagekit.service");

describe("Product Controller", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
      sellerId: "seller123",
      files: [],
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  // -------------------- CREATE PRODUCT --------------------
  describe("createProduct", () => {
    it("should return 400 if validation fails", async () => {
      req.body = { title: "" };
      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invalid data" })
      );
    });

    it("should create a product with images", async () => {
      req.body = {
        title: "Test Product",
        description: "Test Description",
        price: { amount: 100, currency: "USD" },
        stock: 10,
      };
      req.files = [
        { buffer: Buffer.from("image1") },
        { buffer: Buffer.from("image2") },
      ];

      (uploadImage as jest.Mock)
        .mockResolvedValueOnce("image-url-1")
        .mockResolvedValueOnce("image-url-2");
      (Product.create as jest.Mock).mockResolvedValue({
        _id: "product123",
        title: "Test Product",
        images: ["image-url-1", "image-url-2"],
      });

      await createProduct(req, res);

      expect(uploadImage).toHaveBeenCalledTimes(2);
      expect(Product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Test Product",
          seller: "seller123",
          images: ["image-url-1", "image-url-2"],
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Product created",
          product: expect.any(Object),
        })
      );
    });

    it("should create a product without images", async () => {
      req.body = {
        title: "Test Product",
        description: "Test Description",
        price: { amount: 100, currency: "USD" },
        stock: 10,
      };
      req.files = [];

      (Product.create as jest.Mock).mockResolvedValue({
        _id: "product123",
        title: "Test Product",
        images: [],
      });

      await createProduct(req, res);

      expect(uploadImage).not.toHaveBeenCalled();
      expect(Product.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 500 on error", async () => {
      req.body = {
        title: "Test Product",
        description: "Test Description",
        price: { amount: 100, currency: "USD" },
        stock: 10,
      };
      (Product.create as jest.Mock).mockRejectedValue(new Error("fail"));

      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to create product",
      });
    });
  });

  // -------------------- GET PRODUCTS --------------------
  describe("getProducts", () => {
    it("should return all products without filters", async () => {
      const mockProducts = [
        { _id: "1", title: "Product 1" },
        { _id: "2", title: "Product 2" },
      ];

      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue(mockProducts);
      (Product.find as jest.Mock).mockReturnValue({
        skip: mockSkip,
        limit: mockLimit,
      });

      await getProducts(req, res);

      expect(Product.find).toHaveBeenCalledWith({});
      expect(mockSkip).toHaveBeenCalledWith(0);
      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "products found",
        products: mockProducts,
      });
    });

    it("should filter products by search query", async () => {
      req.query = { q: "laptop" };
      const mockProducts = [{ _id: "1", title: "Laptop" }];

      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue(mockProducts);
      (Product.find as jest.Mock).mockReturnValue({
        skip: mockSkip,
        limit: mockLimit,
      });

      await getProducts(req, res);

      expect(Product.find).toHaveBeenCalledWith({
        $text: { $search: "laptop" },
      });
    });

    it("should filter products by price range", async () => {
      req.query = { minprice: "50", maxprice: "200" };
      const mockProducts = [{ _id: "1", title: "Product" }];

      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue(mockProducts);
      (Product.find as jest.Mock).mockReturnValue({
        skip: mockSkip,
        limit: mockLimit,
      });

      await getProducts(req, res);

      expect(Product.find).toHaveBeenCalledWith({
        "price.amount": { $gte: 50, $lte: 200 },
      });
    });

    it("should handle pagination with skip", async () => {
      req.query = { skip: "20" };
      const mockProducts = [{ _id: "1", title: "Product" }];

      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue(mockProducts);
      (Product.find as jest.Mock).mockReturnValue({
        skip: mockSkip,
        limit: mockLimit,
      });

      await getProducts(req, res);

      expect(mockSkip).toHaveBeenCalledWith(20);
    });

    it("should return empty array when no products found", async () => {
      const mockSkip = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue([]);
      (Product.find as jest.Mock).mockReturnValue({
        skip: mockSkip,
        limit: mockLimit,
      });

      await getProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "No products found",
        products: [],
      });
    });

    it("should return 500 on error", async () => {
      (Product.find as jest.Mock).mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error("fail")),
      });

      await getProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to get all products",
      });
    });
  });

  // -------------------- GET PRODUCT --------------------
  describe("getProduct", () => {
    it("should return 400 if id is invalid", async () => {
      req.params.id = "invalid-id";
      jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(false);

      await getProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "productId required.",
      });
    });

    it("should return 404 if product not found", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(true);
      (Product.findById as jest.Mock).mockResolvedValue(null);

      await getProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Product not found",
        product: null,
      });
    });

    it("should return product if found", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      const mockProduct = { _id: "507f1f77bcf86cd799439011", title: "Product" };
      jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(true);
      (Product.findById as jest.Mock).mockResolvedValue(mockProduct);

      await getProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Product fetched",
        product: mockProduct,
      });
    });

    it("should return 500 on error", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(true);
      (Product.findById as jest.Mock).mockRejectedValue(new Error("fail"));

      await getProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to get product",
      });
    });
  });

  // -------------------- UPDATE PRODUCT --------------------
  describe("updateProduct", () => {
    it("should return 400 if id is invalid", async () => {
      req.params.id = "invalid-id";
      jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(false);

      await updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid id." });
    });

    it("should return 400 if validation fails", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      req.body = { price: "invalid" };
      jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(true);

      await updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invalid data." })
      );
    });

    it("should return 404 if product not found", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      req.body = { title: "Updated Title" };
      jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(true);
      (Product.findById as jest.Mock).mockResolvedValue(null);

      await updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Product not found.",
        product: null,
      });
    });

    it("should update product successfully", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      req.body = { title: "Updated Title", stock: 20 };
      const oldProduct = {
        _id: "507f1f77bcf86cd799439011",
        title: "Old Title",
        description: "Old Description",
        price: { amount: 100, currency: "USD" },
        stock: 10,
      };
      const updatedProduct = { ...oldProduct, title: "Updated Title", stock: 20 };

      jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(true);
      (Product.findById as jest.Mock).mockResolvedValue(oldProduct);
      (Product.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedProduct);

      await updateProduct(req, res);

      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        expect.objectContaining({
          title: "Updated Title",
          stock: 20,
        }),
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Product updated.",
        product: updatedProduct,
      });
    });

    it("should return 500 on error", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      req.body = { title: "Updated Title" };
      jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(true);
      (Product.findById as jest.Mock).mockRejectedValue(new Error("fail"));

      await updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to update product",
      });
    });
  });

  // -------------------- DELETE PRODUCT --------------------
  describe("deleteProduct", () => {
    it("should return 400 if id is invalid", async () => {
      req.params.id = "invalid-id";
      jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(false);

      await deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid id." });
    });

    it("should return 404 if product not found", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(true);
      (Product.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Product not found." });
    });

    it("should delete product successfully", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      const deletedProduct = {
        _id: "507f1f77bcf86cd799439011",
        title: "Deleted Product",
      };
      jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(true);
      (Product.findByIdAndDelete as jest.Mock).mockResolvedValue(deletedProduct);

      await deleteProduct(req, res);

      expect(Product.findByIdAndDelete).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Product deleted." });
    });

    it("should return 500 on error", async () => {
      req.params.id = "507f1f77bcf86cd799439011";
      jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(true);
      (Product.findByIdAndDelete as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      await deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to delete product",
      });
    });
  });

  // -------------------- GET SELLER PRODUCTS --------------------
  describe("getSellerProduct", () => {
    it("should return empty array when seller has no products", async () => {
      (Product.find as jest.Mock).mockResolvedValue([]);

      await getSellerProduct(req, res);

      expect(Product.find).toHaveBeenCalledWith({ seller: "seller123" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "No products found",
        products: [],
      });
    });

    it("should return seller products", async () => {
      const mockProducts = [
        { _id: "1", title: "Product 1", seller: "seller123" },
        { _id: "2", title: "Product 2", seller: "seller123" },
      ];
      (Product.find as jest.Mock).mockResolvedValue(mockProducts);

      await getSellerProduct(req, res);

      expect(Product.find).toHaveBeenCalledWith({ seller: "seller123" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "products found",
        products: mockProducts,
      });
    });

    it("should return 500 on error", async () => {
      (Product.find as jest.Mock).mockRejectedValue(new Error("fail"));

      await getSellerProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to get products",
      });
    });
  });
});