import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { ValidationMiddleware } from '../middleware/validation';
import { LoggingMiddleware } from '../middleware/logging';
import { RateLimitMiddleware } from '../middleware/rateLimit';
import Logger from '../utils/logger';
import Joi from 'joi';

export class UserController {
  private static instance: UserController;
  private userService: UserService;
  private validationMiddleware: ValidationMiddleware;
  private loggingMiddleware: LoggingMiddleware;
  private rateLimitMiddleware: RateLimitMiddleware;
  private logger: typeof Logger;

  constructor() {
    this.userService = UserService.getInstance();
    this.validationMiddleware = ValidationMiddleware.getInstance();
    this.loggingMiddleware = LoggingMiddleware.getInstance();
    this.rateLimitMiddleware = RateLimitMiddleware.getInstance();
    this.logger = Logger;
  }

  public static getInstance(): UserController {
    if (!UserController.instance) {
      UserController.instance = new UserController();
    }
    return UserController.instance;
  }

  /**
   * Validation schemas
   */
  private readonly createUserSchema = Joi.object({
    name: Joi.string().min(2).max(200).required(),
    email: Joi.string().email().max(100).required(),
    password: Joi.string().min(8).max(200).required(),
    phone_number: Joi.string().min(8).max(15).optional(),
    role_id: Joi.number().integer().min(1).optional(),
    status_id: Joi.number().integer().min(1).optional(),
    free_trial: Joi.boolean().optional(),
    email_verified: Joi.boolean().optional()
  });

  private readonly updateUserSchema = Joi.object({
    name: Joi.string().min(2).max(200).optional(),
    email: Joi.string().email().max(100).optional(),
    phone_number: Joi.string().min(8).max(15).optional(),
    status_id: Joi.number().integer().min(1).optional(),
    free_trial: Joi.boolean().optional(),
    email_verified: Joi.boolean().optional()
  });

  private readonly getUserListSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().max(100).optional(),
    role_id: Joi.number().integer().min(1).optional(),
    status_id: Joi.number().integer().min(1).optional(),
    free_trial: Joi.boolean().optional(),
    sortBy: Joi.string().valid('id', 'name', 'email', 'created_at', 'updated_at').default('created_at'),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
  });

  private readonly getUserByIdSchema = Joi.object({
    id: Joi.number().integer().min(1).required()
  });

  private readonly assignRoleSchema = Joi.object({
    user_id: Joi.number().integer().min(1).required(),
    role_id: Joi.number().integer().min(1).required()
  });

  private readonly removeRoleSchema = Joi.object({
    user_id: Joi.number().integer().min(1).required(),
    role_id: Joi.number().integer().min(1).required()
  });

  /**
   * Create a new user
   * @route POST /api/users
   */
  public createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      this.logger.info('User creation attempt', { email: req.body.email });

      const result = await this.userService.createUser(req.body);

      if (result.success) {
        this.loggingMiddleware.logBusinessEvent('user_created', {
          user_id: result.data?.id,
          email: req.body.email,
          createdBy: (req as any).user?.id
        });
        res.status(201).json(result);
      } else {
        this.logger.warn('User creation failed', { 
          email: req.body.email, 
          error: result.error 
        });
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('User creation error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'User creation failed'
      });
    }
  };

  /**
   * Get list of users with pagination and filters
   * @route GET /api/users
   */
  public getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const pagination = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        sortBy: (req.query.sortBy as string) || 'created_at',
        sortOrder: ((req.query.sortOrder as string) || 'DESC') as 'ASC' | 'DESC'
      };

      // Accept both slug-based and id-based filters. Prefer slugs when provided.
      const filters = {
        search: req.query.search as string,
        role: req.query.role as string || undefined,
        role_id: req.query.role_id ? parseInt(req.query.role_id as string) : undefined,
        status: req.query.status as string || undefined,
        status_id: req.query.status_id ? parseInt(req.query.status_id as string) : undefined,
        free_trial: req.query.free_trial ? req.query.free_trial === 'true' : undefined
      };

      this.logger.info('User list request', { pagination, filters });

  const result = await this.userService.getAllUsers(pagination, filters as any);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      this.logger.error('Get users error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Failed to get users'
      });
    }
  };

  /**
   * Get user by ID
   * @route GET /api/users/:id
   */
  public getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt((req.params.id as string) || '0');
      
      this.logger.info('Get user by ID request', { userId });

      const result = await this.userService.getUserById(userId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      this.logger.error('Get user by ID error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Failed to get user'
      });
    }
  };

  /**
   * Update user
   * @route PUT /api/users/:id
   */
  public updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt((req.params.id as string) || '0');
      
      this.logger.info('User update attempt', { userId });

      const result = await this.userService.updateUser(userId, req.body);

      if (result.success) {
        this.loggingMiddleware.logBusinessEvent('user_updated', {
          userId,
          updatedBy: (req as any).user?.id,
          changes: req.body
        });
        res.status(200).json(result);
      } else {
        this.logger.warn('User update failed', { 
          userId, 
          error: result.error 
        });
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('User update error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'User update failed'
      });
    }
  };

  /**
   * Delete user
   * @route DELETE /api/users/:id
   */
  public deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt((req.params.id as string) || '0');
      
      this.logger.info('User deletion attempt', { userId });

      const result = await this.userService.deleteUser(userId);

      if (result.success) {
        this.loggingMiddleware.logBusinessEvent('user_deleted', {
          userId,
          deletedBy: (req as any).user?.id
        });
        res.status(200).json(result);
      } else {
        this.logger.warn('User deletion failed', { 
          userId, 
          error: result.error 
        });
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('User deletion error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'User deletion failed'
      });
    }
  };

  /**
   * Assign role to user
   * @route POST /api/users/:id/roles
   */
  public assignRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt((req.params.id as string) || '0');
      const { roleId } = req.body;
      
      this.logger.info('Role assignment attempt', { userId, roleId });

      const result = await this.userService.assignRole(userId, roleId);

      if (result.success) {
        this.loggingMiddleware.logBusinessEvent('role_assigned', {
          userId,
          roleId,
          assignedBy: (req as any).user?.id
        });
        res.status(200).json(result);
      } else {
        this.logger.warn('Role assignment failed', { 
          userId, 
          roleId, 
          error: result.error 
        });
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('Role assignment error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Role assignment failed'
      });
    }
  };

  /**
   * Remove role from user
   * @route DELETE /api/users/:id/roles/:roleId
   */
  public removeRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt((req.params.id as string) || '0');
      const roleId = parseInt((req.params.role_id as string) || '0');
      
      this.logger.info('Role removal attempt', { userId, roleId });

      const result = await this.userService.removeRole(userId, roleId);

      if (result.success) {
        this.loggingMiddleware.logBusinessEvent('role_removed', {
          userId,
          roleId,
          removedBy: (req as any).user?.id
        });
        res.status(200).json(result);
      } else {
        this.logger.warn('Role removal failed', { 
          userId, 
          roleId, 
          error: result.error 
        });
        res.status(400).json(result);
      }
    } catch (error) {
      this.logger.error('Role removal error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Role removal failed'
      });
    }
  };

  /**
   * Get user roles
   * @route GET /api/users/:id/roles
   */
  public getUserRoles = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt((req.params.id as string) || '0');
      
      this.logger.info('Get user roles request', { userId });

      const result = await this.userService.getUserRoles(userId);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      this.logger.error('Get user roles error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Failed to get user roles'
      });
    }
  };

  /**
   * Get user activities
   * @route GET /api/users/:id/activities
   */
  public getUserActivities = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt((req.params.id as string) || '0');
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      this.logger.info('Get user activities request', { userId, page, limit });

      // TODO: Implement get user activities functionality
      const result = { success: true, data: { activities: [], total: 0, totalPages: 0, currentPage: page } };

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      this.logger.error('Get user activities error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Failed to get user activities'
      });
    }
  };

  /**
   * Get user statistics
   * @route GET /api/users/:id/stats
   */
  public getUserStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = parseInt((req.params.id as string) || '0');
      
      this.logger.info('Get user stats request', { userId });

      const result = await this.userService.getUserStats();

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      this.logger.error('Get user stats error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Failed to get user statistics'
      });
    }
  };

  /**
   * Get all roles
   * @route GET /api/users/roles
   */
  public getRoles = async (req: Request, res: Response): Promise<void> => {
    try {
      this.logger.info('Get all roles request');

      // TODO: Implement get all roles functionality
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
   * Get all user statuses
   * @route GET /api/users/statuses
   */
  public getUserStatuses = async (req: Request, res: Response): Promise<void> => {
    try {
      this.logger.info('Get user statuses request');

      // TODO: Implement get all user statuses functionality
      const result = { success: true, data: [] };

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      this.logger.error('Get user statuses error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'Failed to get user statuses'
      });
    }
  };

  /**
   * Health check for user service
   * @route GET /api/users/health
   */
  public healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        message: 'User service is healthy',
        timestamp: new Date().toISOString(),
        service: 'users'
      });
    } catch (error) {
      this.logger.error('User health check error', error);
      res.status(500).json({
        success: false,
        message: 'User service is unhealthy',
        error: 'Health check failed'
      });
    }
  };

  /**
   * Get validation middleware for each endpoint
   */
  public getValidationMiddleware() {
    return {
      createUser: this.validationMiddleware.validateBody(this.createUserSchema),
      updateUser: this.validationMiddleware.validateBody(this.updateUserSchema),
      getUsers: this.validationMiddleware.validateQuery(this.getUserListSchema),
      getUserById: this.validationMiddleware.validateParams(this.getUserByIdSchema),
      assignRole: this.validationMiddleware.validateBody(this.assignRoleSchema),
      removeRole: this.validationMiddleware.validateParams(this.removeRoleSchema)
    };
  }

  /**
   * Get rate limiting middleware for each endpoint
   */
  public getRateLimitMiddleware() {
    return {
      createUser: this.rateLimitMiddleware.adminRateLimit(10, 900000), // 10 per 15 minutes
      getUsers: this.rateLimitMiddleware.adminRateLimit(100, 900000), // 100 per 15 minutes
      getUserById: this.rateLimitMiddleware.adminRateLimit(200, 900000), // 200 per 15 minutes
      updateUser: this.rateLimitMiddleware.adminRateLimit(50, 900000), // 50 per 15 minutes
      deleteUser: this.rateLimitMiddleware.adminRateLimit(5, 900000), // 5 per 15 minutes
      assignRole: this.rateLimitMiddleware.adminRateLimit(20, 900000), // 20 per 15 minutes
      removeRole: this.rateLimitMiddleware.adminRateLimit(20, 900000), // 20 per 15 minutes
      getUserRoles: this.rateLimitMiddleware.adminRateLimit(100, 900000), // 100 per 15 minutes
      getUserActivities: this.rateLimitMiddleware.adminRateLimit(100, 900000), // 100 per 15 minutes
      getUserStats: this.rateLimitMiddleware.adminRateLimit(100, 900000), // 100 per 15 minutes
      getRoles: this.rateLimitMiddleware.adminRateLimit(100, 900000), // 100 per 15 minutes
      getUserStatuses: this.rateLimitMiddleware.adminRateLimit(100, 900000) // 100 per 15 minutes
    };
  }
}

export default UserController;
