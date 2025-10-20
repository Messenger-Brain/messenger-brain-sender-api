import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Token from '../models/Token';
import TokenType from '../models/TokenType';
import User from '../models/User';
import UserRole from '../models/UserRole';
import Role from '../models/Role';
import UserStatus from '../models/UserStatus';
import { ConfigService } from '../config/ConfigService';
import Logger from '../utils/logger';
import { JWTPayload } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    status: string;
    freeTrial: boolean;
  };
  tokenType?: 'jwt' | 'personal_token';
}

export class AuthMiddleware {
  private static instance: AuthMiddleware;
  private configService: ConfigService;
  private logger: typeof Logger;

  private constructor() {
    this.configService = ConfigService.getInstance();
    this.logger = Logger;
  }

  public static getInstance(): AuthMiddleware {
    if (!AuthMiddleware.instance) {
      AuthMiddleware.instance = new AuthMiddleware();
    }
    return AuthMiddleware.instance;
  }

  /**
   * Main authentication middleware
   * Validates JWT for send-api.messengerbrain.com or personal_token for other origins
   */
  public authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const origin = req.get('origin') || req.get('referer') || '';
      const isFromRequiredDomain = this.isFromRequiredDomain(origin);

      this.logger.info('Authentication attempt', { 
        origin, 
        isFromRequiredDomain,
        userAgent: req.get('user-agent')
      });

      if (isFromRequiredDomain) {
        // Validate JWT token
        await this.validateJWTToken(req, res, next);
      } else {
        // Validate personal token
        await this.validatePersonalToken(req, res, next);
      }
    } catch (error) {
      this.logger.error('Authentication middleware error', error);
      res.status(500).json({
        success: false,
        message: 'Authentication error',
        error: 'Internal server error'
      });
    }
  };

  /**
   * Validate JWT token for requests from send-api.messengerbrain.com
   */
  private async validateJWTToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        this.logger.warn('JWT authentication failed - no token provided', { origin: req.get('origin') });
        res.status(401).json({
          success: false,
          message: 'Access token required',
          error: 'No authorization header provided'
        });
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const jwtConfig = this.configService.getJWTConfig();

      // Verify JWT token
      const decoded = jwt.verify(token, jwtConfig.secret) as JWTPayload;

      // Get user with relations
      const user = await User.findByPk(decoded.id, {
        include: [
          {
            model: UserRole,
            include: [{ model: Role }]
          },
          {
            model: UserStatus
          }
        ]
      });

      if (!user) {
        this.logger.warn('JWT authentication failed - user not found', { userId: decoded.id });
        res.status(401).json({
          success: false,
          message: 'Invalid token',
          error: 'User not found'
        });
        return;
      }

      // Check user status
      if (user.statusId !== 1) { // Assuming 1 is active status
        this.logger.warn('JWT authentication failed - user inactive', { userId: user.id, statusId: user.statusId });
        res.status(401).json({
          success: false,
          message: 'Account is inactive',
          error: 'User account is not active'
        });
        return;
      }

      // Set user info in request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.UserRoles?.[0]?.Role?.slug || 'user',
        status: user.UserStatus?.slug || 'active',
        freeTrial: user.freeTrial
      };
      req.tokenType = 'jwt';

      this.logger.authEvent('login', user.id, true);
      next();

    } catch (error) {
      this.logger.warn('JWT authentication failed - invalid token', { error: error instanceof Error ? error.message : 'Unknown error' });
      res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'Token verification failed'
      });
    }
  }

  /**
   * Validate personal token for requests from other origins
   */
  private async validatePersonalToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        this.logger.warn('Personal token authentication failed - no token provided', { origin: req.get('origin') });
        res.status(401).json({
          success: false,
          message: 'Personal access token required',
          error: 'No authorization header provided'
        });
        return;
      }

      const tokenValue = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Find token in database
      const token = await Token.findOne({
        where: { value: tokenValue },
        include: [
          {
            model: TokenType,
            where: { slug: 'personal_token' }
          },
          {
            model: User,
            include: [
              {
                model: UserRole,
                include: [{ model: Role }]
              },
              {
                model: UserStatus
              }
            ]
          }
        ]
      });

      if (!token) {
        this.logger.warn('Personal token authentication failed - token not found', { tokenValue: tokenValue.substring(0, 10) + '...' });
        res.status(401).json({
          success: false,
          message: 'Invalid personal token',
          error: 'Token not found or invalid'
        });
        return;
      }

      // Check user status
      if (token.User?.statusId !== 1) { // Assuming 1 is active status
        this.logger.warn('Personal token authentication failed - user inactive', { userId: token.User?.id, statusId: token.User?.statusId });
        res.status(401).json({
          success: false,
          message: 'Account is inactive',
          error: 'User account is not active'
        });
        return;
      }

      // Set user info in request
      req.user = {
        id: token.User!.id,
        email: token.User!.email,
        role: token.User!.UserRoles?.[0]?.Role?.slug || 'user',
        status: token.User!.UserStatus?.slug || 'active',
        freeTrial: token.User!.freeTrial
      };
      req.tokenType = 'personal_token';

      this.logger.authEvent('login', token.User!.id, true);
      next();

    } catch (error) {
      this.logger.error('Personal token authentication error', error);
      res.status(401).json({
        success: false,
        message: 'Authentication failed',
        error: 'Token validation error'
      });
    }
  }

  /**
   * Check if request is from required domain
   */
  private isFromRequiredDomain(origin: string): boolean {
    const requiredDomain = 'send-api.messengerbrain.com';
    
    if (!origin) {
      return false;
    }

    try {
      const url = new URL(origin);
      return url.hostname === requiredDomain;
    } catch {
      return false;
    }
  }

  /**
   * Optional authentication - doesn't fail if no token provided
   */
  public optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No token provided, continue without authentication
        next();
        return;
      }

      // Try to authenticate normally
      await this.authenticate(req, res, next);
    } catch (error) {
      this.logger.warn('Optional authentication failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      // Continue without authentication
      next();
    }
  };

  /**
   * Require admin role
   */
  public requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'No user information found'
      });
      return;
    }

    if (req.user.role !== 'admin') {
      this.logger.warn('Admin access denied', { userId: req.user.id, role: req.user.role });
      res.status(403).json({
        success: false,
        message: 'Admin access required',
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
  };

  /**
   * Require specific role
   */
  public requireRole = (requiredRole: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'No user information found'
        });
        return;
      }

      if (req.user.role !== requiredRole) {
        this.logger.warn('Role access denied', { 
          userId: req.user.id, 
          userRole: req.user.role, 
          requiredRole 
        });
        res.status(403).json({
          success: false,
          message: `${requiredRole} access required`,
          error: 'Insufficient permissions'
        });
        return;
      }

      next();
    };
  };

  /**
   * Require active user status
   */
  public requireActiveUser = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'No user information found'
      });
      return;
    }

    if (req.user.status !== 'active') {
      this.logger.warn('Inactive user access denied', { userId: req.user.id, status: req.user.status });
      res.status(403).json({
        success: false,
        message: 'Active account required',
        error: 'Account is not active'
      });
      return;
    }

    next();
  };

  /**
   * Validate user owns the resource
   */
  public validateOwnership = (getUserIdFromParams: (req: Request) => number) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'No user information found'
        });
        return;
      }

      const resourceUserId = getUserIdFromParams(req);
      
      if (req.user.role !== 'admin' && req.user.id !== resourceUserId) {
        this.logger.warn('Ownership validation failed', { 
          userId: req.user.id, 
          resourceUserId,
          role: req.user.role 
        });
        res.status(403).json({
          success: false,
          message: 'Access denied',
          error: 'You can only access your own resources'
        });
        return;
      }

      next();
    };
  };

  /**
   * Rate limiting based on token type
   */
  public rateLimitByTokenType = (jwtLimit: number, personalTokenLimit: number) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      // This would integrate with a rate limiting library like express-rate-limit
      // For now, we'll just pass through
      next();
    };
  };

  /**
   * Log authentication events
   */
  public logAuthEvent = (event: string, details?: any) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      this.logger.authEvent(event as any, req.user?.id, true);
      next();
    };
  };
}

export default AuthMiddleware;
