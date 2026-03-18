import express from "express";
import userRoutes from "./user-routes.js";
import postRoutes from "./post-routes.js";
import commentRoutes from "./comment-routes.js";

import chatRoutes from "./chat-routes.js";

const router = express.Router();

router.use("/users", userRoutes);
router.use("/posts", postRoutes);
router.use("/comments", commentRoutes);
router.use("/chat", chatRoutes);

export default router;
