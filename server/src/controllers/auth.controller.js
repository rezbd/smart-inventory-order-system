import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import AppError from '../utils/AppError.js';
import { logActivity } from '../services/activityLog.service.js';

// ─── Helper: Sign JWT ────────────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ─── Helper: Create & send token response ───────────────────────────
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Strip password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  });
};

// ─── POST /api/v1/auth/signup ────────────────────────────────────────
export const signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Prevent privilege escalation — only allow 'staff' on self-signup
    const safeRole = role === 'admin' ? 'staff' : role;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('An account with this email already exists.', 409));
    }

    const newUser = await User.create({ name, email, password, role: safeRole });

    await logActivity({
      action: 'USER_REGISTERED',
      message: `New user "${newUser.name}" registered.`,
      entityType: 'User',
      entityId: newUser._id,
      performedBy: newUser._id,
    });

    createSendToken(newUser, 201, res);
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/v1/auth/login ─────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate inputs
    if (!email || !password) {
      return next(new AppError('Please provide both email and password.', 400));
    }

    // 2. Find user and explicitly select password (it's select:false by default)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      // Generic message — don't reveal whether email exists
      return next(new AppError('Invalid email or password.', 401));
    }

    // 3. Compare passwords
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return next(new AppError('Invalid email or password.', 401));
    }

    await logActivity({
      action: 'USER_LOGIN',
      message: `User "${user.name}" logged in.`,
      entityType: 'User',
      entityId: user._id,
      performedBy: user._id,
    });

    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/v1/auth/me ─────────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    // req.user is already attached by the protect middleware
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};