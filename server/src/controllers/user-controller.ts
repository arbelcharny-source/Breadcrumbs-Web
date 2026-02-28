import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware.js';
import { sendCreated, sendSuccess } from '../utils/response.js';
import userService from '../services/user.service.js';

interface CreateUserBody {
  username: string;
  email: string;
  fullName: string;
  password: string;
}

interface LoginBody {
  username: string;
  password: string;
}

interface RefreshTokenBody {
  refreshToken: string;
}

export const createUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { username, email, fullName, password } = req.body as CreateUserBody;

  const result = await userService.createUser(username, email, fullName, password);

  sendCreated(res, result);
});

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body as LoginBody;

  const result = await userService.login(username, password);

  sendSuccess(res, result);
});

export const refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as RefreshTokenBody;

  const tokens = await userService.refreshToken(refreshToken);

  sendSuccess(res, tokens);
});

export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as RefreshTokenBody;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  await userService.logout(userId, refreshToken);

  sendSuccess(res, { message: 'Logged out successfully' });
});

export const logoutAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  await userService.logoutAll(userId);

  sendSuccess(res, { message: 'Logged out from all devices successfully' });
});

export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const user = await userService.getUserById(id);

  sendSuccess(res, user);
});

export const getAllUsers = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const users = await userService.getAllUsers();

  sendSuccess(res, users);
});

interface UpdateUserBody {
  username?: string;
  email?: string;
  fullName?: string;
}

export const updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const updates = req.body as UpdateUserBody;

  const user = await userService.updateUser(id, updates);

  sendSuccess(res, user);
});

export const deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  await userService.deleteUser(id);

  sendSuccess(res, { message: 'User deleted successfully' });
});
