import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { ValidationMiddleware } from '../middleware/validation';
import { LoggingMiddleware } from '../middleware/logging';
import { RateLimitMiddleware } from '../middleware/rateLimit';
import Logger from '../utils/logger';
import Joi from 'joi';

export class AuthController {
  private static instance: AuthController;
  private authService: AuthService;
  private userService: UserService;
  private validationMiddleware: ValidationMiddleware;
  private loggingMiddleware: LoggingMiddleware;
  private rateLimitMiddleware: RateLimitMiddleware;
  private logger: typeof Logger;

  constructor() {
    this.authService = AuthService.getInstance();
    this.userService = UserService.getInstance();
    this.validationMiddleware = ValidationMiddleware.getInstance();
    this.loggingMiddleware = LoggingMiddleware.getInstance();
    this.rateLimitMiddleware = RateLimitMiddleware.getInstance();
    this.logger = Logger;
  }

  public static getInstance(): AuthController {
    if (!AuthController.instance) {
      AuthController.instance = new AuthController();
    }
    return AuthController.instance;
  }

  /**
   * Validation schemas
   */
  private readonly registerSchema = Joi.object({
    name: Joi.string().min(2).max(200).required(),
    email: Joi.string().email().max(100).required(),
    password: Joi.string().min(8).max(200).required(),
    roleId: Joi.number().integer().min(1).optional()
  });

  private readonly loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  private readonly changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).max(200).required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
  });

  private readonly resetPasswordRequestSchema = Joi.object({
    email: Joi.string().email().required()
  });

  private readonly resetPasswordSchema = Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(8).max(200).required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
  });

  private readonly refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required()
  });

  /**
   * Register a new user
   * @route POST /api/auth/register
   */
  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      this.logger.info('User registration attempt', { email: req.body.email });

      const result = await this.authService.register(req.body);

      if (result.success) {
        this.loggingMiddleware.logAuthEvent(req, res, result);
        res.status(201).json(result);
      } else {
        this.logger.warn('User registration failed', { 
          email: req.body.email, 
          error: result.error 
        });
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('User registration error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Registration failed'
      });
    }
  };

  /**
   * Login user
   * @route POST /api/auth/login
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      this.logger.info('User login attempt', { email: req.body.email });

      const result = await this.authService.login(req.body);

      if (result.success) {
        this.loggingMiddleware.logAuthEvent(req, res, result);
        res.status(200).json(result);
      } else {
        this.logger.warn('User login failed', { 
          email: req.body.email, 
          error: result.error 
        });
        res.status(401).json(result);
      }
    } catch (error) {
      this.logger.error('User login error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Login failed'
      });
    }
  };

  /**
   * Logout user
   * @route POST /api/auth/logout
   */
  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      // In a real implementation, you would invalidate the token
      // For now, we'll just log the logout event
      this.loggingMiddleware.logAuthEvent(req, res, { success: true });
      
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      this.logger.error('User logout error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Logout failed'
      });
    }
  };

  /**
   * Change user password
   * @route PUT /api/auth/change-password
   */
  public changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'User not authenticated'
        });
        return;
      }

      this.logger.info('Password change attempt', { userId });

      // TODO: Implement changePassword method in AuthService
      const result = { success: true, message: 'Password changed successfully' };

      if (result.success) {
        this.loggingMiddleware.logAuthEvent(req, res, result);
        res.status(200).json(result);
      } else {
        this.logger.warn('Password change failed', { 
          userId, 
          error: (result as any).error 
        });
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('Password change error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Password change failed'
      });
    }
  };

  /**
   * Request password reset
   * @route POST /api/auth/reset-password-request
   */
  public resetPasswordRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      this.logger.info('Password reset request', { email: req.body.email });

      // TODO: Implement password reset functionality
      const result = { success: true, message: 'Password reset request received' };

      // Always return success to prevent email enumeration
      res.status(200).json({
        success: true,
        message: 'If the email exists, a reset link has been sent'
      });
    } catch (error) {
      this.logger.error('Password reset request error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Password reset request failed'
      });
    }
  };

  /**
   * Reset password with token
   * @route POST /api/auth/reset-password
   */
  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      this.logger.info('Password reset attempt', { token: req.body.token?.substring(0, 10) + '...' });

      const result = await this.authService.resetPassword(req.body);

      if (result.success) {
        this.loggingMiddleware.logAuthEvent(req, res, result);
        res.status(200).json(result);
      } else {
        this.logger.warn('Password reset failed', { 
          token: req.body.token?.substring(0, 10) + '...', 
          error: result.error 
        });
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('Password reset error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Password reset failed'
      });
    }
  };

  /**
   * Refresh access token
   * @route POST /api/auth/refresh
   */
  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      this.logger.info('Token refresh attempt', { 
        refreshToken: req.body.refreshToken?.substring(0, 10) + '...' 
      });

      const result = await this.authService.refreshToken(req.body.refreshToken);

      if (result.success) {
        this.loggingMiddleware.logAuthEvent(req, res, result);
        res.status(200).json(result);
      } else {
        this.logger.warn('Token refresh failed', { 
          refreshToken: req.body.refreshToken?.substring(0, 10) + '...', 
          error: result.error 
        });
        res.status(401).json(result);
      }
    } catch (error) {
      this.logger.error('Token refresh error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Token refresh failed'
      });
    }
  };

  /**
   * Get current user profile
   * @route GET /api/auth/profile
   */
  public getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'User not authenticated'
        });
        return;
      }

      const result = await this.userService.getUserById(userId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      this.logger.error('Get profile error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Failed to get profile'
      });
    }
  };

  /**
   * Update user profile
   * @route PUT /api/auth/profile
   */
  public updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'User not authenticated'
        });
        return;
      }

      const result = await this.userService.updateUser(userId, req.body);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('Update profile error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Failed to update profile'
      });
    }
  };

  /**
   * Verify email address
   * @route POST /api/auth/verify-email
   */
  public verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;

      this.logger.info('Email verification attempt', { 
        token: token?.substring(0, 10) + '...' 
      });

      // TODO: Implement email verification functionality
      const result = { success: true, message: 'Email verified successfully' };

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('Email verification error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Email verification failed'
      });
    }
  };

  /**
   * Resend email verification
   * @route POST /api/auth/resend-verification
   */
  public resendVerification = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'User not authenticated'
        });
        return;
      }

      this.logger.info('Resend verification attempt', { userId });

      // TODO: Implement resend verification functionality
      const result = { success: true, message: 'Verification email sent' };

      res.status(200).json(result);
    } catch (error) {
      this.logger.error('Resend verification error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Failed to resend verification'
      });
    }
  };

  /**
   * Get user roles
   * @route GET /api/auth/roles
   */
  public getRoles = async (req: Request, res: Response): Promise<void> => {
    try {
      // TODO: Implement get roles functionality
      const result = { success: true, data: [] };

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      this.logger.error('Get roles error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Failed to get roles'
      });
    }
  };

  /**
   * Get current user information
   * @route GET /api/auth/me
   */
  public getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          freeTrial: user.freeTrial
        }
      });
    } catch (error) {
      this.logger.error('Error getting current user', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Health check for auth service
   * @route GET /api/auth/health
   */
  public healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        message: 'Auth service is healthy',
        timestamp: new Date().toISOString(),
        service: 'auth'
      });
    } catch (error) {
      this.logger.error('Auth health check error', error);
      res.status(500).json({
        success: false,
        message: 'Auth service is unhealthy',
        error: 'Health check failed'
      });
    }
  };

  /**
   * Get validation middleware for each endpoint
   */
  public getValidationMiddleware() {
    return {
      register: this.validationMiddleware.validateBody(this.registerSchema),
      login: this.validationMiddleware.validateBody(this.loginSchema),
      changePassword: this.validationMiddleware.validateBody(this.changePasswordSchema),
      resetPasswordRequest: this.validationMiddleware.validateBody(this.resetPasswordRequestSchema),
      resetPassword: this.validationMiddleware.validateBody(this.resetPasswordSchema),
      refreshToken: this.validationMiddleware.validateBody(this.refreshTokenSchema)
    };
  }

  /**
   * Get rate limiting middleware for each endpoint
   */
  public getRateLimitMiddleware() {
    return {
      register: this.rateLimitMiddleware.authRateLimit(3, 900000), // 3 attempts per 15 minutes
      login: this.rateLimitMiddleware.authRateLimit(5, 900000), // 5 attempts per 15 minutes
      changePassword: this.rateLimitMiddleware.authRateLimit(3, 900000), // 3 attempts per 15 minutes
      resetPasswordRequest: this.rateLimitMiddleware.authRateLimit(3, 900000), // 3 attempts per 15 minutes
      resetPassword: this.rateLimitMiddleware.authRateLimit(3, 900000), // 3 attempts per 15 minutes
      refreshToken: this.rateLimitMiddleware.authRateLimit(10, 900000) // 10 attempts per 15 minutes
    };
  }
}

export default AuthController;
