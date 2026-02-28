import User, { IUser } from '../models/user.js';
import { AppError } from '../middleware/error.middleware.js';
import { generateTokenPair, TokenPair, JWTPayload, verifyRefreshToken } from '../utils/jwt.js';

export interface UserResponse {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserRegistrationResult {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

export class UserService {
  async createUser(username: string, email: string, fullName: string, password: string): Promise<UserRegistrationResult> {
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new AppError('Username already exists', 409);
      }
      if (existingUser.email === email) {
        throw new AppError('Email already exists', 409);
      }
    }

    const user = await User.create({ username, email, fullName, password });

    const payload: JWTPayload = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    };

    const tokens = generateTokenPair(payload);

    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: tokens.refreshToken }
    });

    const userResponse: UserResponse = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      user: userResponse,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(username: string, password: string): Promise<LoginResult> {
    const user = await User.findOne({ username }).select('+password +refreshTokens');

    if (!user) {
      throw new AppError('Invalid username or password', 401);
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new AppError('Invalid username or password', 401);
    }

    const payload: JWTPayload = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    };

    const tokens = generateTokenPair(payload);

    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: tokens.refreshToken }
    });

    const userResponse: UserResponse = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      user: userResponse,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    let payload: JWTPayload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await User.findById(payload.userId).select('+refreshTokens');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.refreshTokens.includes(refreshToken)) {
      throw new AppError('Invalid refresh token', 401);
    }

    const newTokens = generateTokenPair({
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    });

    const updatedTokens = user.refreshTokens.filter(token => token !== refreshToken);
    updatedTokens.push(newTokens.refreshToken);

    await User.findByIdAndUpdate(user._id, {
      $set: { refreshTokens: updatedTokens }
    });

    return newTokens;
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: refreshToken }
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $set: { refreshTokens: [] }
    });
  }

  async getUserById(userId: string): Promise<UserResponse> {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(`User with id ${userId} not found`, 404);
    }

    return {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getAllUsers(): Promise<UserResponse[]> {
    const users = await User.find({});

    return users.map(user => ({
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  async updateUser(userId: string, updates: { username?: string; email?: string; fullName?: string }): Promise<UserResponse> {
    if (updates.username) {
      const existingUser = await User.findOne({ username: updates.username, _id: { $ne: userId } });
      if (existingUser) {
        throw new AppError('Username already exists', 409);
      }
    }

    if (updates.email) {
      const existingUser = await User.findOne({ email: updates.email, _id: { $ne: userId } });
      if (existingUser) {
        throw new AppError('Email already exists', 409);
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new AppError(`User with id ${userId} not found`, 404);
    }

    return {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      throw new AppError(`User with id ${userId} not found`, 404);
    }
  }

  async checkUserExists(userId: string): Promise<boolean> {
    const user = await User.findById(userId);
    return !!user;
  }
}

export default new UserService();
