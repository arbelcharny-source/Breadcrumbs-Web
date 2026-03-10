import dotenv from "dotenv";
import express, { Express } from "express";
import router from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { setupSwagger } from "./config/swagger.js";
import cors from "cors";
import path from "path";
import fs from "fs";

dotenv.config();

const app: Express = express();

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), uploadDir)));

setupSwagger(app);

app.use("/", router);

app.use(errorHandler);

export default app;