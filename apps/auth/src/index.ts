import express, { Express } from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config();

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());

import { userRouter } from "./route/user.route";
app.use("/api/auth", userRouter);

app.get("/", (req, res) => {
  res.send("One piece is Real!");
});

export default app;
