import { Request, Response, NextFunction } from 'express';
import { isValidObjectId } from '../utils/validation.js';
import { sendValidationError } from '../utils/response.js';

export const validateUserRegistration = (req: Request, res: Response, next: NextFunction): void => {
  const { username, email, fullName, password } = req.body;

  if (!username || !email || !fullName || !password) {
    sendValidationError(res, 'Username, email, fullName, and password are required');
    return;
  }

  if (typeof username !== 'string' || typeof email !== 'string' || typeof fullName !== 'string' || typeof password !== 'string') {
    sendValidationError(res, 'Username, email, fullName, and password must be strings');
    return;
  }

  if (username.trim().length < 3 || username.trim().length > 50) {
    sendValidationError(res, 'Username must be between 3 and 50 characters');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    sendValidationError(res, 'Invalid email format');
    return;
  }

  if (fullName.trim().length < 2 || fullName.trim().length > 100) {
    sendValidationError(res, 'Full name must be between 2 and 100 characters');
    return;
  }

  if (password.length < 6 || password.length > 100) {
    sendValidationError(res, 'Password must be between 6 and 100 characters');
    return;
  }

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { username, password } = req.body;

  if (!username || !password) {
    sendValidationError(res, 'Username and password are required');
    return;
  }

  if (typeof username !== 'string' || typeof password !== 'string') {
    sendValidationError(res, 'Username and password must be strings');
    return;
  }

  next();
};

export const validateRefreshToken = (req: Request, res: Response, next: NextFunction): void => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    sendValidationError(res, 'Refresh token is required');
    return;
  }

  if (typeof refreshToken !== 'string') {
    sendValidationError(res, 'Refresh token must be a string');
    return;
  }

  next();
};

export const validatePostCreation = (req: Request, res: Response, next: NextFunction): void => {
  const { title, tripName, content, ownerId, location } = req.body;

  if ((!title && !tripName) || !content || !ownerId) {
    sendValidationError(res, 'Title (or tripName), content, and ownerId are required');
    return;
  }

  if (!isValidObjectId(ownerId)) {
    sendValidationError(res, 'Invalid ownerId format');
    return;
  }

  if (location !== undefined && typeof location !== 'string') {
    sendValidationError(res, 'Location must be a string');
    return;
  }

  next();
};

export const validatePostUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { content, location, title } = req.body;

  if (content === undefined && location === undefined && title === undefined && !req.file) {
    sendValidationError(res, 'At least one field (content, location, title, or image) is required for update');
    return;
  }

  if (content !== undefined) {
    if (typeof content !== 'string') {
      sendValidationError(res, 'Content must be a string');
      return;
    }
    if (content.trim().length < 1 || content.trim().length > 10000) {
      sendValidationError(res, 'Content must be between 1 and 10000 characters');
      return;
    }
  }

  if (location !== undefined && typeof location !== 'string') {
    sendValidationError(res, 'Location must be a string');
    return;
  }

  if (title !== undefined && typeof title !== 'string') {
    sendValidationError(res, 'Title must be a string');
    return;
  }

  next();
};

export const validateCommentCreation = (req: Request, res: Response, next: NextFunction): void => {
  const { content, postId } = req.body;

  if (!content || !postId) {
    sendValidationError(res, 'Content and postId are required');
    return;
  }

  if (typeof content !== 'string' || typeof postId !== 'string') {
    sendValidationError(res, 'Content and postId must be strings');
    return;
  }

  if (content.trim().length < 1 || content.trim().length > 5000) {
    sendValidationError(res, 'Content must be between 1 and 5000 characters');
    return;
  }

  if (!isValidObjectId(postId)) {
    sendValidationError(res, 'Invalid postId format');
    return;
  }

  next();
};

export const validateCommentUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { content } = req.body;

  if (!content) {
    sendValidationError(res, 'Content is required');
    return;
  }

  if (typeof content !== 'string') {
    sendValidationError(res, 'Content must be a string');
    return;
  }

  if (content.trim().length < 1 || content.trim().length > 5000) {
    sendValidationError(res, 'Content must be between 1 and 5000 characters');
    return;
  }

  next();
};

export const validateUserUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { username, email, fullName, bio } = req.body;

  if (!username && !email && !fullName && !bio && !req.file) {
    sendValidationError(res, 'At least one field (username, email, fullName, bio, or image) is required');
    return;
  }

  if (username !== undefined) {
    if (typeof username !== 'string') {
      sendValidationError(res, 'Username must be a string');
      return;
    }
    if (username.trim().length < 3 || username.trim().length > 50) {
      sendValidationError(res, 'Username must be between 3 and 50 characters');
      return;
    }
  }

  if (email !== undefined) {
    if (typeof email !== 'string') {
      sendValidationError(res, 'Email must be a string');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      sendValidationError(res, 'Invalid email format');
      return;
    }
  }

  if (fullName !== undefined) {
    if (typeof fullName !== 'string') {
      sendValidationError(res, 'Full name must be a string');
      return;
    }
    if (fullName.trim().length < 2 || fullName.trim().length > 100) {
      sendValidationError(res, 'Full name must be between 2 and 100 characters');
      return;
    }
  }

  if (bio !== undefined) {
    if (typeof bio !== 'string') {
      sendValidationError(res, 'Bio must be a string');
      return;
    }
    if (bio.length > 200) {
      sendValidationError(res, 'Bio cannot exceed 200 characters');
      return;
    }
  }

  next();
};
