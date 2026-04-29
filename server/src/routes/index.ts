import express from "express";
import userRoutes from "./user-routes.js";
import postRoutes from "./post-routes.js";
import commentRoutes from "./comment-routes.js";

import chatRoutes from "./chat-routes.js";
import agentRoutes from "./agent-routes.js";

const router = express.Router();

router.use("/users", userRoutes);
router.use("/posts", postRoutes);
router.use("/comments", commentRoutes);
router.use("/chat", chatRoutes);
router.use("/agent", agentRoutes);

export default router;
