import mongoose from "mongoose";

export const connectToDB = async (): Promise<void> => {
  try {
    const dbUri = process.env.MONGO_DB_URL;

    if (!dbUri) {
        throw new Error("MONGO_DB_URL is not defined in .env file");
    }

    await mongoose.connect(dbUri);
    console.log("Connected to DB!");
    
  } catch (error) {
    console.log(error);
  }
};