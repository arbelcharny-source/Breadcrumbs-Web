import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';

export const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

export const validateObjectId = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName] as string;

    if (!isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
      return;
    }

    next();
  };
};

export const validateRequiredFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields = fields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
      return;
    }

    next();
  };
};

export const validateStringLength = (field: string, minLength: number, maxLength: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.body[field];

    if (typeof value !== 'string') {
      res.status(400).json({
        success: false,
        message: `${field} must be a string`
      });
      return;
    }

    if (value.length < minLength || value.length > maxLength) {
      res.status(400).json({
        success: false,
        message: `${field} must be between ${minLength} and ${maxLength} characters`
      });
      return;
    }

    next();
  };
};
