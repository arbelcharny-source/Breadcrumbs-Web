import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware.js';
import { sendSuccess } from '../utils/response.js';
import chatService from '../services/chat.service.js';

export const getChatHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { partnerId } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const history = await chatService.getChatHistory(userId, partnerId as string);
  sendSuccess(res, history);
});

export const getUserChats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const chats = await chatService.getUserChats(userId);
  sendSuccess(res, chats);
});
