import UserPreference from '../models/UserPreference';
import UserPreferenceStatus from '../models/UserPreferenceStatus';
import UserPreferenceOption from '../models/UserPreferenceOption';
import SystemPreference from '../models/SystemPreference';
import User from '../models/User';
import { ConfigService } from '../config/ConfigService';
import Logger from '../utils/logger';
import { Op } from 'sequelize';
import { 
  CreateUserPreferenceRequest,
  UpdateUserPreferenceRequest,
  CreateUserPreferenceOptionRequest,
  UpdateUserPreferenceOptionRequest,
  PaginationQuery,
  FilterQuery,
  ApiResponse,
  PaginatedResponse 
} from '../types';

export interface UserPreferenceServiceInterface {
  createUserPreference(preferenceData: CreateUserPreferenceRequest): Promise<ApiResponse<UserPreference>>;
  getUserPreferenceById(preferenceId: number, userId: number): Promise<ApiResponse<UserPreference>>;
  getUserPreferences(userId: number, pagination?: PaginationQuery): Promise<PaginatedResponse<UserPreference>>;
  updateUserPreference(preferenceId: number, userId: number, preferenceData: UpdateUserPreferenceRequest): Promise<ApiResponse<UserPreference>>;
  deleteUserPreference(preferenceId: number, userId: number): Promise<ApiResponse<void>>;
  getUserPreferencesByUser(userId: number, pagination?: PaginationQuery): Promise<PaginatedResponse<UserPreference>>;
  getUserPreferencesBySystemPreference(systemPreferenceId: number, pagination?: PaginationQuery): Promise<PaginatedResponse<UserPreference>>;
  getUserPreferencesByStatus(statusSlug: string, pagination?: PaginationQuery): Promise<PaginatedResponse<UserPreference>>;
  createUserPreferenceOption(optionData: CreateUserPreferenceOptionRequest): Promise<ApiResponse<UserPreferenceOption>>;
  getUserPreferenceOptionById(optionId: number): Promise<ApiResponse<UserPreferenceOption>>;
  getUserPreferenceOptions(userPreferenceId: number, pagination?: PaginationQuery): Promise<PaginatedResponse<UserPreferenceOption>>;
  updateUserPreferenceOption(optionId: number, optionData: UpdateUserPreferenceOptionRequest): Promise<ApiResponse<UserPreferenceOption>>;
  deleteUserPreferenceOption(optionId: number): Promise<ApiResponse<void>>;
  getSystemPreferences(): Promise<ApiResponse<SystemPreference[]>>;
  getSystemPreferenceById(systemPreferenceId: number): Promise<ApiResponse<SystemPreference>>;
  getUserPreferenceStats(userId: number): Promise<ApiResponse<any>>;
  validateUserPreferenceAccess(preferenceId: number, userId: number): Promise<boolean>;
}

export class UserPreferenceService implements UserPreferenceServiceInterface {
  private static instance: UserPreferenceService;
  private configService: ConfigService;
  private logger: typeof Logger;

  constructor() {
    this.configService = ConfigService.getInstance();
    this.logger = Logger;
  }

  public static getInstance(): UserPreferenceService {
    if (!UserPreferenceService.instance) {
      UserPreferenceService.instance = new UserPreferenceService();
    }
    return UserPreferenceService.instance;
  }

  /**
   * Create a new user preference
   */
  public async createUserPreference(preferenceData: CreateUserPreferenceRequest): Promise<ApiResponse<UserPreference>> {
    try {
      this.logger.info('Creating user preference', { userId: preferenceData.userId, systemPreferenceId: preferenceData.systemPreferenceId });

      // Check if user already has this system preference
      const existingPreference = await UserPreference.findOne({
        where: {
          userId: preferenceData.userId,
          systemPreferenceId: preferenceData.systemPreferenceId
        }
      });

      if (existingPreference) {
        return {
          success: false,
          message: 'User already has this preference configured'
        };
      }

      // Create user preference
      const userPreference = await UserPreference.create({
        userId: preferenceData.userId,
        systemPreferenceId: preferenceData.systemPreferenceId,
        statusId: preferenceData.statusId
      });

      // Get user preference with relations
      const userPreferenceWithRelations = await this.getUserPreferenceById(userPreference.id, preferenceData.userId);

      this.logger.info('User preference created successfully', { preferenceId: userPreference.id });

      return {
        success: true,
        message: 'User preference created successfully',
        data: userPreferenceWithRelations.data!
      };

    } catch (error) {
      this.logger.error('Failed to create user preference', error);
      return {
        success: false,
        message: 'Failed to create user preference',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user preference by ID
   */
  public async getUserPreferenceById(preferenceId: number, userId: number): Promise<ApiResponse<UserPreference>> {
    try {
      const userPreference = await UserPreference.findOne({
        where: { id: preferenceId, userId },
        include: [
          {
            model: User
          },
          {
            model: SystemPreference
          },
          {
            model: UserPreferenceStatus
          },
          {
            model: UserPreferenceOption
          }
        ]
      });

      if (!userPreference) {
        return {
          success: false,
          message: 'User preference not found or access denied'
        };
      }

      return {
        success: true,
        message: 'User preference retrieved successfully',
        data: userPreference
      };

    } catch (error) {
      this.logger.error('Failed to get user preference by ID', error);
      return {
        success: false,
        message: 'Failed to retrieve user preference',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all user preferences with pagination
   */
  public async getUserPreferences(userId: number, pagination: PaginationQuery = {}): Promise<PaginatedResponse<UserPreference>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;
      const sortBy = pagination.sortBy || 'createdAt';
      const sortOrder = pagination.sortOrder || 'DESC';

      const { count, rows } = await UserPreference.findAndCountAll({
        where: { userId },
        include: [
          {
            model: User
          },
          {
            model: SystemPreference
          },
          {
            model: UserPreferenceStatus
          },
          {
            model: UserPreferenceOption
          }
        ],
        limit,
        offset,
        order: [[sortBy, sortOrder]]
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'User preferences retrieved successfully',
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      };

    } catch (error) {
      this.logger.error('Failed to get user preferences', error);
      return {
        success: false,
        message: 'Failed to retrieve user preferences',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Update user preference
   */
  public async updateUserPreference(preferenceId: number, userId: number, preferenceData: UpdateUserPreferenceRequest): Promise<ApiResponse<UserPreference>> {
    try {
      this.logger.info('Updating user preference', { preferenceId, userId });

      // Validate access
      const accessValid = await this.validateUserPreferenceAccess(preferenceId, userId);
      if (!accessValid) {
        return {
          success: false,
          message: 'User preference not found or access denied'
        };
      }

      const userPreference = await UserPreference.findByPk(preferenceId);
      if (!userPreference) {
        return {
          success: false,
          message: 'User preference not found'
        };
      }

      // Update user preference
      await userPreference.update(preferenceData);

      const updatedUserPreference = await this.getUserPreferenceById(preferenceId, userId);

      this.logger.info('User preference updated successfully', { preferenceId });

      return {
        success: true,
        message: 'User preference updated successfully',
        data: updatedUserPreference.data!
      };

    } catch (error) {
      this.logger.error('Failed to update user preference', error);
      return {
        success: false,
        message: 'Failed to update user preference',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete user preference
   */
  public async deleteUserPreference(preferenceId: number, userId: number): Promise<ApiResponse<void>> {
    try {
      this.logger.info('Deleting user preference', { preferenceId, userId });

      // Validate access
      const accessValid = await this.validateUserPreferenceAccess(preferenceId, userId);
      if (!accessValid) {
        return {
          success: false,
          message: 'User preference not found or access denied'
        };
      }

      const userPreference = await UserPreference.findByPk(preferenceId);
      if (!userPreference) {
        return {
          success: false,
          message: 'User preference not found'
        };
      }

      // Delete user preference options first
      await UserPreferenceOption.destroy({ where: { userPreferenceId: preferenceId } });

      // Delete user preference
      await userPreference.destroy();

      this.logger.info('User preference deleted successfully', { preferenceId });

      return {
        success: true,
        message: 'User preference deleted successfully'
      };

    } catch (error) {
      this.logger.error('Failed to delete user preference', error);
      return {
        success: false,
        message: 'Failed to delete user preference',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user preferences by user
   */
  public async getUserPreferencesByUser(userId: number, pagination: PaginationQuery = {}): Promise<PaginatedResponse<UserPreference>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await UserPreference.findAndCountAll({
        where: { userId },
        include: [
          {
            model: User
          },
          {
            model: SystemPreference
          },
          {
            model: UserPreferenceStatus
          },
          {
            model: UserPreferenceOption
          }
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'User preferences retrieved successfully',
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      };

    } catch (error) {
      this.logger.error('Failed to get user preferences by user', error);
      return {
        success: false,
        message: 'Failed to retrieve user preferences',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Get user preferences by system preference
   */
  public async getUserPreferencesBySystemPreference(systemPreferenceId: number, pagination: PaginationQuery = {}): Promise<PaginatedResponse<UserPreference>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await UserPreference.findAndCountAll({
        where: { systemPreferenceId },
        include: [
          {
            model: User
          },
          {
            model: SystemPreference
          },
          {
            model: UserPreferenceStatus
          },
          {
            model: UserPreferenceOption
          }
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'User preferences retrieved successfully',
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      };

    } catch (error) {
      this.logger.error('Failed to get user preferences by system preference', error);
      return {
        success: false,
        message: 'Failed to retrieve user preferences',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Get user preferences by status
   */
  public async getUserPreferencesByStatus(statusSlug: string, pagination: PaginationQuery = {}): Promise<PaginatedResponse<UserPreference>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;

      const statusId = await this.getStatusIdBySlug(statusSlug);

      const { count, rows } = await UserPreference.findAndCountAll({
        where: { statusId },
        include: [
          {
            model: User
          },
          {
            model: SystemPreference
          },
          {
            model: UserPreferenceStatus
          },
          {
            model: UserPreferenceOption
          }
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'User preferences retrieved successfully',
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      };

    } catch (error) {
      this.logger.error('Failed to get user preferences by status', error);
      return {
        success: false,
        message: 'Failed to retrieve user preferences',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Create user preference option
   */
  public async createUserPreferenceOption(optionData: CreateUserPreferenceOptionRequest): Promise<ApiResponse<UserPreferenceOption>> {
    try {
      this.logger.info('Creating user preference option', { userPreferenceId: optionData.userPreferenceId, slug: optionData.slug });

      // Check if option with same slug already exists for this preference
      const existingOption = await UserPreferenceOption.findOne({
        where: {
          userPreferenceId: optionData.userPreferenceId,
          slug: optionData.slug
        }
      });

      if (existingOption) {
        return {
          success: false,
          message: 'Option with this slug already exists for this preference'
        };
      }

      // Create user preference option
      const option = await UserPreferenceOption.create({
        userPreferenceId: optionData.userPreferenceId,
        slug: optionData.slug,
        value: optionData.value
      });

      this.logger.info('User preference option created successfully', { optionId: option.id });

      return {
        success: true,
        message: 'User preference option created successfully',
        data: option
      };

    } catch (error) {
      this.logger.error('Failed to create user preference option', error);
      return {
        success: false,
        message: 'Failed to create user preference option',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user preference option by ID
   */
  public async getUserPreferenceOptionById(optionId: number): Promise<ApiResponse<UserPreferenceOption>> {
    try {
      const option = await UserPreferenceOption.findByPk(optionId, {
        include: [
          {
            model: UserPreference
          }
        ]
      });

      if (!option) {
        return {
          success: false,
          message: 'User preference option not found'
        };
      }

      return {
        success: true,
        message: 'User preference option retrieved successfully',
        data: option
      };

    } catch (error) {
      this.logger.error('Failed to get user preference option by ID', error);
      return {
        success: false,
        message: 'Failed to retrieve user preference option',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user preference options
   */
  public async getUserPreferenceOptions(userPreferenceId: number, pagination: PaginationQuery = {}): Promise<PaginatedResponse<UserPreferenceOption>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await UserPreferenceOption.findAndCountAll({
        where: { userPreferenceId },
        include: [
          {
            model: UserPreference
          }
        ],
        limit,
        offset,
        order: [['slug', 'ASC']]
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'User preference options retrieved successfully',
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      };

    } catch (error) {
      this.logger.error('Failed to get user preference options', error);
      return {
        success: false,
        message: 'Failed to retrieve user preference options',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Update user preference option
   */
  public async updateUserPreferenceOption(optionId: number, optionData: UpdateUserPreferenceOptionRequest): Promise<ApiResponse<UserPreferenceOption>> {
    try {
      this.logger.info('Updating user preference option', { optionId });

      const option = await UserPreferenceOption.findByPk(optionId);
      if (!option) {
        return {
          success: false,
          message: 'User preference option not found'
        };
      }

      // Update option
      await option.update(optionData);

      this.logger.info('User preference option updated successfully', { optionId });

      return {
        success: true,
        message: 'User preference option updated successfully',
        data: option
      };

    } catch (error) {
      this.logger.error('Failed to update user preference option', error);
      return {
        success: false,
        message: 'Failed to update user preference option',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete user preference option
   */
  public async deleteUserPreferenceOption(optionId: number): Promise<ApiResponse<void>> {
    try {
      this.logger.info('Deleting user preference option', { optionId });

      const option = await UserPreferenceOption.findByPk(optionId);
      if (!option) {
        return {
          success: false,
          message: 'User preference option not found'
        };
      }

      // Delete option
      await option.destroy();

      this.logger.info('User preference option deleted successfully', { optionId });

      return {
        success: true,
        message: 'User preference option deleted successfully'
      };

    } catch (error) {
      this.logger.error('Failed to delete user preference option', error);
      return {
        success: false,
        message: 'Failed to delete user preference option',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get system preferences
   */
  public async getSystemPreferences(): Promise<ApiResponse<SystemPreference[]>> {
    try {
      const systemPreferences = await SystemPreference.findAll({
        order: [['slug', 'ASC']]
      });

      return {
        success: true,
        message: 'System preferences retrieved successfully',
        data: systemPreferences
      };

    } catch (error) {
      this.logger.error('Failed to get system preferences', error);
      return {
        success: false,
        message: 'Failed to retrieve system preferences',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get system preference by ID
   */
  public async getSystemPreferenceById(systemPreferenceId: number): Promise<ApiResponse<SystemPreference>> {
    try {
      const systemPreference = await SystemPreference.findByPk(systemPreferenceId);

      if (!systemPreference) {
        return {
          success: false,
          message: 'System preference not found'
        };
      }

      return {
        success: true,
        message: 'System preference retrieved successfully',
        data: systemPreference
      };

    } catch (error) {
      this.logger.error('Failed to get system preference by ID', error);
      return {
        success: false,
        message: 'Failed to retrieve system preference',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user preference statistics
   */
  public async getUserPreferenceStats(userId: number): Promise<ApiResponse<any>> {
    try {
      const totalPreferences = await UserPreference.count({ where: { userId } });
      const activePreferences = await UserPreference.count({
        where: {
          userId,
          statusId: await this.getStatusIdBySlug('active')
        }
      });

      const totalOptions = await UserPreferenceOption.count({
        include: [
          {
            model: UserPreference,
            where: { userId }
          }
        ]
      });

      const stats = {
        userId,
        totalPreferences,
        activePreferences,
        totalOptions
      };

      return {
        success: true,
        message: 'User preference statistics retrieved successfully',
        data: stats
      };

    } catch (error) {
      this.logger.error('Failed to get user preference stats', error);
      return {
        success: false,
        message: 'Failed to retrieve user preference statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate user preference access
   */
  public async validateUserPreferenceAccess(preferenceId: number, userId: number): Promise<boolean> {
    try {
      const userPreference = await UserPreference.findOne({
        where: { id: preferenceId, userId }
      });

      return !!userPreference;
    } catch (error) {
      this.logger.error('Failed to validate user preference access', error);
      return false;
    }
  }

  /**
   * Helper method to get status ID by slug
   */
  private async getStatusIdBySlug(slug: string): Promise<number> {
    const status = await UserPreferenceStatus.findOne({ where: { slug } });
    return status?.id || 1; // Default to first status
  }
}

export default UserPreferenceService;
