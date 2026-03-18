import { OAuth2Client } from 'google-auth-library';
import User from '../models/user.js';
import { AppError } from '../middleware/error.middleware.js';
import { generateTokenPair, TokenPair, JWTPayload, verifyRefreshToken } from '../utils/jwt.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface UserResponse {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  createdAt?: Date;
  updatedAt?: Date;
  profileUrl?: string;
  bio?: string;
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
      profileUrl: user.profileUrl,
      bio: user.bio
    };

    return {
      user: userResponse,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(identifier: string, password: string): Promise<LoginResult> {
    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }]
    }).select('+password +refreshTokens');

    if (!user) {
      throw new AppError('Invalid username or password', 401);
    }

    if (!user.password) {
      throw new AppError('Please login with Google', 400);
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
      profileUrl: user.profileUrl,
      bio: user.bio
    };

    return {
      user: userResponse,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async googleLogin(accessToken: string): Promise<LoginResult> {
    client.setCredentials({ access_token: accessToken });

    const userInfo = await client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo'
    });

    const payload: any = userInfo.data;

    if (!payload || !payload.email) {
      throw new AppError('Invalid Google Token', 400);
    }

    const { email, name, picture, sub } = payload;
    let user = await User.findOne({ email });

    if (!user) {
      let baseUsername = email.split('@')[0];
      let username = `${baseUsername}_${sub.substring(0, 5)}`;
      
      let isUnique = false;
      while (!isUnique) {
        const existing = await User.findOne({ username });
        if (existing) {
          username = `${baseUsername}_${Math.floor(Math.random() * 10000)}`;
        } else {
          isUnique = true;
        }
      }

      user = await User.create({
        email,
        username,
        fullName: name || username,
        googleId: sub,
        profileUrl: picture
      });
    } else {
      let updated = false;
      if (!user.googleId) {
        user.googleId = sub;
        updated = true;
      }
      if (!user.profileUrl && picture) {
        user.profileUrl = picture;
        updated = true;
      }
      if (updated) await user.save();
    }

    const tokenPayload: JWTPayload = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    };

    const tokens = generateTokenPair(tokenPayload);

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
      profileUrl: user.profileUrl,
      bio: user.bio
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
      profileUrl: user.profileUrl,
      bio: user.bio
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
      profileUrl: user.profileUrl,
      bio: user.bio
    }));
  }

  async updateUser(userId: string, updates: { username?: string; email?: string; fullName?: string; bio?: string; profileUrl?: string }): Promise<UserResponse> {
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
      profileUrl: user.profileUrl,
      bio: user.bio
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