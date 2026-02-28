import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectToDB } from "./config/mongo-db.js";

const PORT = process.env.PORT || 3000;

connectToDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});