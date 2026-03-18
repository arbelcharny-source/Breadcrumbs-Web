import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export const sendSuccess = <T>(res: Response, data: T, statusCode: number = 200): void => {
  res.status(statusCode).json({
    success: true,
    data
  } as ApiResponse<T>);
};

export const sendError = (res: Response, message: string, statusCode: number = 400): void => {
  res.status(statusCode).json({
    success: false,
    error: message
  } as ApiResponse);
};

export const sendCreated = <T>(res: Response, data: T): void => {
  sendSuccess(res, data, 201);
};

export const sendNotFound = (res: Response, resource: string, id: string): void => {
  sendError(res, `${resource} with id ${id} not found`, 404);
};

export const sendValidationError = (res: Response, message: string): void => {
  sendError(res, message, 400);
};

export const sendServerError = (res: Response, error: Error): void => {
  sendError(res, error.message, 500);
};
