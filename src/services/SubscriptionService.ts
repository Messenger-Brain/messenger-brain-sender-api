import Subscription from '../models/Subscription';
import SubscriptionStatus from '../models/SubscriptionStatus';
import SubscriptionFeature from '../models/SubscriptionFeature';
import UserSubscription from '../models/UserSubscription';
import UserSubscriptionStatus from '../models/UserSubscriptionStatus';
import User from '../models/User';
import { ConfigService } from '../config/ConfigService';
import Logger from '../utils/logger';
import { Op } from 'sequelize';
import { 
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  CreateUserSubscriptionRequest,
  UpdateUserSubscriptionRequest,
  PaginationQuery,
  FilterQuery,
  ApiResponse,
  PaginatedResponse 
} from '../types';

export interface SubscriptionServiceInterface {
  createSubscription(subscriptionData: CreateSubscriptionRequest): Promise<ApiResponse<Subscription>>;
  getSubscriptionById(subscriptionId: number): Promise<ApiResponse<Subscription>>;
  getAllSubscriptions(pagination?: PaginationQuery, filters?: FilterQuery): Promise<PaginatedResponse<Subscription>>;
  updateSubscription(subscriptionId: number, subscriptionData: UpdateSubscriptionRequest): Promise<ApiResponse<Subscription>>;
  deleteSubscription(subscriptionId: number): Promise<ApiResponse<void>>;
  getActiveSubscriptions(): Promise<ApiResponse<Subscription[]>>;
  createUserSubscription(userSubscriptionData: CreateUserSubscriptionRequest): Promise<ApiResponse<UserSubscription>>;
  getUserSubscriptionById(userSubscriptionId: number, userId: number): Promise<ApiResponse<UserSubscription>>;
  getUserSubscriptions(userId: number, pagination?: PaginationQuery): Promise<PaginatedResponse<UserSubscription>>;
  updateUserSubscription(userSubscriptionId: number, userId: number, userSubscriptionData: UpdateUserSubscriptionRequest): Promise<ApiResponse<UserSubscription>>;
  deleteUserSubscription(userSubscriptionId: number, userId: number): Promise<ApiResponse<void>>;
  getUserActiveSubscription(userId: number): Promise<ApiResponse<UserSubscription | null>>;
  getSubscriptionFeatures(subscriptionId: number): Promise<ApiResponse<SubscriptionFeature[]>>;
  addSubscriptionFeature(subscriptionId: number, featureData: { slug: string; value: string }): Promise<ApiResponse<SubscriptionFeature>>;
  updateSubscriptionFeature(featureId: number, featureData: { slug?: string; value?: string }): Promise<ApiResponse<SubscriptionFeature>>;
  deleteSubscriptionFeature(featureId: number): Promise<ApiResponse<void>>;
  getSubscriptionStats(): Promise<ApiResponse<any>>;
  getUserSubscriptionStats(userId: number): Promise<ApiResponse<any>>;
  validateUserSubscriptionAccess(userSubscriptionId: number, userId: number): Promise<boolean>;
}

export class SubscriptionService implements SubscriptionServiceInterface {
  private static instance: SubscriptionService;
  private configService: ConfigService;
  private logger: typeof Logger;

  constructor() {
    this.configService = ConfigService.getInstance();
    this.logger = Logger;
  }

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  /**
   * Create a new subscription
   */
  public async createSubscription(subscriptionData: CreateSubscriptionRequest): Promise<ApiResponse<Subscription>> {
    try {
      this.logger.info('Creating subscription', { slug: subscriptionData.slug });

      // Check if subscription with same slug already exists
      const existingSubscription = await Subscription.findOne({
        where: { slug: subscriptionData.slug }
      });

      if (existingSubscription) {
        return {
          success: false,
          message: 'Subscription with this slug already exists'
        };
      }

      // Create subscription
      const subscription = await Subscription.create({
        slug: subscriptionData.slug,
        description: subscriptionData.description,
        statusId: subscriptionData.statusId,
        price: subscriptionData.price
      });

      // Get subscription with relations
      const subscriptionWithRelations = await this.getSubscriptionById(subscription.id);

      this.logger.info('Subscription created successfully', { subscriptionId: subscription.id });

      return {
        success: true,
        message: 'Subscription created successfully',
        data: subscriptionWithRelations.data!
      };

    } catch (error) {
      this.logger.error('Failed to create subscription', error);
      return {
        success: false,
        message: 'Failed to create subscription',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get subscription by ID
   */
  public async getSubscriptionById(subscriptionId: number): Promise<ApiResponse<Subscription>> {
    try {
      const subscription = await Subscription.findByPk(subscriptionId, {
        include: [
          {
            model: SubscriptionStatus
          },
          {
            model: SubscriptionFeature
          }
        ]
      });

      if (!subscription) {
        return {
          success: false,
          message: 'Subscription not found'
        };
      }

      return {
        success: true,
        message: 'Subscription retrieved successfully',
        data: subscription
      };

    } catch (error) {
      this.logger.error('Failed to get subscription by ID', error);
      return {
        success: false,
        message: 'Failed to retrieve subscription',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all subscriptions with pagination and filters
   */
  public async getAllSubscriptions(pagination: PaginationQuery = {}, filters: FilterQuery = {}): Promise<PaginatedResponse<Subscription>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;
      const sortBy = pagination.sortBy || 'createdAt';
      const sortOrder = pagination.sortOrder || 'DESC';

      // Build where clause
      const whereClause: any = {};
      
      if (filters.search) {
        whereClause[Op.or] = [
          { slug: { [Op.like]: `%${filters.search}%` } },
          { description: { [Op.like]: `%${filters.search}%` } }
        ];
      }

      if (filters.status) {
        whereClause.statusId = await this.getStatusIdBySlug(filters.status);
      }

      // Get subscriptions with pagination
      const { count, rows } = await Subscription.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: SubscriptionStatus
          },
          {
            model: SubscriptionFeature
          }
        ],
        limit,
        offset,
        order: [[sortBy, sortOrder]]
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'Subscriptions retrieved successfully',
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      };

    } catch (error) {
      this.logger.error('Failed to get all subscriptions', error);
      return {
        success: false,
        message: 'Failed to retrieve subscriptions',
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
   * Update subscription
   */
  public async updateSubscription(subscriptionId: number, subscriptionData: UpdateSubscriptionRequest): Promise<ApiResponse<Subscription>> {
    try {
      this.logger.info('Updating subscription', { subscriptionId });

      const subscription = await Subscription.findByPk(subscriptionId);
      if (!subscription) {
        return {
          success: false,
          message: 'Subscription not found'
        };
      }

      // Update subscription
      await subscription.update(subscriptionData);

      const updatedSubscription = await this.getSubscriptionById(subscriptionId);

      this.logger.info('Subscription updated successfully', { subscriptionId });

      return {
        success: true,
        message: 'Subscription updated successfully',
        data: updatedSubscription.data!
      };

    } catch (error) {
      this.logger.error('Failed to update subscription', error);
      return {
        success: false,
        message: 'Failed to update subscription',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete subscription
   */
  public async deleteSubscription(subscriptionId: number): Promise<ApiResponse<void>> {
    try {
      this.logger.info('Deleting subscription', { subscriptionId });

      const subscription = await Subscription.findByPk(subscriptionId);
      if (!subscription) {
        return {
          success: false,
          message: 'Subscription not found'
        };
      }

      // Delete subscription features first
      await SubscriptionFeature.destroy({ where: { subscriptionId } });

      // Delete user subscriptions
      await UserSubscription.destroy({ where: { subscriptionId } });

      // Delete subscription
      await subscription.destroy();

      this.logger.info('Subscription deleted successfully', { subscriptionId });

      return {
        success: true,
        message: 'Subscription deleted successfully'
      };

    } catch (error) {
      this.logger.error('Failed to delete subscription', error);
      return {
        success: false,
        message: 'Failed to delete subscription',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get active subscriptions
   */
  public async getActiveSubscriptions(): Promise<ApiResponse<Subscription[]>> {
    try {
      const activeStatusId = await this.getStatusIdBySlug('active');

      const subscriptions = await Subscription.findAll({
        where: { statusId: activeStatusId },
        include: [
          {
            model: SubscriptionStatus
          },
          {
            model: SubscriptionFeature
          }
        ],
        order: [['price', 'ASC']]
      });

      return {
        success: true,
        message: 'Active subscriptions retrieved successfully',
        data: subscriptions
      };

    } catch (error) {
      this.logger.error('Failed to get active subscriptions', error);
      return {
        success: false,
        message: 'Failed to retrieve active subscriptions',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create user subscription
   */
  public async createUserSubscription(userSubscriptionData: CreateUserSubscriptionRequest): Promise<ApiResponse<UserSubscription>> {
    try {
      this.logger.info('Creating user subscription', { userId: userSubscriptionData.userId, subscriptionId: userSubscriptionData.subscriptionId });

      // Check if user already has an active subscription
      const existingSubscription = await UserSubscription.findOne({
        where: {
          userId: userSubscriptionData.userId,
          statusId: await this.getUserSubscriptionStatusIdBySlug('active')
        }
      });

      if (existingSubscription) {
        return {
          success: false,
          message: 'User already has an active subscription'
        };
      }

      // Create user subscription
      const userSubscription = await UserSubscription.create({
        userId: userSubscriptionData.userId,
        subscriptionId: userSubscriptionData.subscriptionId,
        statusId: userSubscriptionData.statusId
      });

      // Get user subscription with relations
      const userSubscriptionWithRelations = await this.getUserSubscriptionById(userSubscription.id, userSubscriptionData.userId);

      this.logger.info('User subscription created successfully', { userSubscriptionId: userSubscription.id });

      return {
        success: true,
        message: 'User subscription created successfully',
        data: userSubscriptionWithRelations.data!
      };

    } catch (error) {
      this.logger.error('Failed to create user subscription', error);
      return {
        success: false,
        message: 'Failed to create user subscription',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user subscription by ID
   */
  public async getUserSubscriptionById(userSubscriptionId: number, userId: number): Promise<ApiResponse<UserSubscription>> {
    try {
      const userSubscription = await UserSubscription.findOne({
        where: { id: userSubscriptionId, userId },
        include: [
          {
            model: User
          },
          {
            model: Subscription,
            include: [
              {
                model: SubscriptionStatus
              },
              {
                model: SubscriptionFeature
              }
            ]
          },
          {
            model: UserSubscriptionStatus
          }
        ]
      });

      if (!userSubscription) {
        return {
          success: false,
          message: 'User subscription not found or access denied'
        };
      }

      return {
        success: true,
        message: 'User subscription retrieved successfully',
        data: userSubscription
      };

    } catch (error) {
      this.logger.error('Failed to get user subscription by ID', error);
      return {
        success: false,
        message: 'Failed to retrieve user subscription',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user subscriptions
   */
  public async getUserSubscriptions(userId: number, pagination: PaginationQuery = {}): Promise<PaginatedResponse<UserSubscription>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;
      const sortBy = pagination.sortBy || 'createdAt';
      const sortOrder = pagination.sortOrder || 'DESC';

      const { count, rows } = await UserSubscription.findAndCountAll({
        where: { userId },
        include: [
          {
            model: User
          },
          {
            model: Subscription,
            include: [
              {
                model: SubscriptionStatus
              },
              {
                model: SubscriptionFeature
              }
            ]
          },
          {
            model: UserSubscriptionStatus
          }
        ],
        limit,
        offset,
        order: [[sortBy, sortOrder]]
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'User subscriptions retrieved successfully',
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      };

    } catch (error) {
      this.logger.error('Failed to get user subscriptions', error);
      return {
        success: false,
        message: 'Failed to retrieve user subscriptions',
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
   * Update user subscription
   */
  public async updateUserSubscription(userSubscriptionId: number, userId: number, userSubscriptionData: UpdateUserSubscriptionRequest): Promise<ApiResponse<UserSubscription>> {
    try {
      this.logger.info('Updating user subscription', { userSubscriptionId, userId });

      // Validate access
      const accessValid = await this.validateUserSubscriptionAccess(userSubscriptionId, userId);
      if (!accessValid) {
        return {
          success: false,
          message: 'User subscription not found or access denied'
        };
      }

      const userSubscription = await UserSubscription.findByPk(userSubscriptionId);
      if (!userSubscription) {
        return {
          success: false,
          message: 'User subscription not found'
        };
      }

      // Update user subscription
      await userSubscription.update(userSubscriptionData);

      const updatedUserSubscription = await this.getUserSubscriptionById(userSubscriptionId, userId);

      this.logger.info('User subscription updated successfully', { userSubscriptionId });

      return {
        success: true,
        message: 'User subscription updated successfully',
        data: updatedUserSubscription.data!
      };

    } catch (error) {
      this.logger.error('Failed to update user subscription', error);
      return {
        success: false,
        message: 'Failed to update user subscription',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete user subscription
   */
  public async deleteUserSubscription(userSubscriptionId: number, userId: number): Promise<ApiResponse<void>> {
    try {
      this.logger.info('Deleting user subscription', { userSubscriptionId, userId });

      // Validate access
      const accessValid = await this.validateUserSubscriptionAccess(userSubscriptionId, userId);
      if (!accessValid) {
        return {
          success: false,
          message: 'User subscription not found or access denied'
        };
      }

      const userSubscription = await UserSubscription.findByPk(userSubscriptionId);
      if (!userSubscription) {
        return {
          success: false,
          message: 'User subscription not found'
        };
      }

      // Delete user subscription
      await userSubscription.destroy();

      this.logger.info('User subscription deleted successfully', { userSubscriptionId });

      return {
        success: true,
        message: 'User subscription deleted successfully'
      };

    } catch (error) {
      this.logger.error('Failed to delete user subscription', error);
      return {
        success: false,
        message: 'Failed to delete user subscription',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user active subscription
   */
  public async getUserActiveSubscription(userId: number): Promise<ApiResponse<UserSubscription | null>> {
    try {
      const activeStatusId = await this.getUserSubscriptionStatusIdBySlug('active');

      const userSubscription = await UserSubscription.findOne({
        where: {
          userId,
          statusId: activeStatusId
        },
        include: [
          {
            model: User
          },
          {
            model: Subscription,
            include: [
              {
                model: SubscriptionStatus
              },
              {
                model: SubscriptionFeature
              }
            ]
          },
          {
            model: UserSubscriptionStatus
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return {
        success: true,
        message: 'User active subscription retrieved successfully',
        data: userSubscription
      };

    } catch (error) {
      this.logger.error('Failed to get user active subscription', error);
      return {
        success: false,
        message: 'Failed to retrieve user active subscription',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get subscription features
   */
  public async getSubscriptionFeatures(subscriptionId: number): Promise<ApiResponse<SubscriptionFeature[]>> {
    try {
      const features = await SubscriptionFeature.findAll({
        where: { subscriptionId },
        order: [['slug', 'ASC']]
      });

      return {
        success: true,
        message: 'Subscription features retrieved successfully',
        data: features
      };

    } catch (error) {
      this.logger.error('Failed to get subscription features', error);
      return {
        success: false,
        message: 'Failed to retrieve subscription features',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Add subscription feature
   */
  public async addSubscriptionFeature(subscriptionId: number, featureData: { slug: string; value: string }): Promise<ApiResponse<SubscriptionFeature>> {
    try {
      this.logger.info('Adding subscription feature', { subscriptionId, slug: featureData.slug });

      // Check if feature with same slug already exists for this subscription
      const existingFeature = await SubscriptionFeature.findOne({
        where: {
          subscriptionId,
          slug: featureData.slug
        }
      });

      if (existingFeature) {
        return {
          success: false,
          message: 'Feature with this slug already exists for this subscription'
        };
      }

      // Create subscription feature
      const feature = await SubscriptionFeature.create({
        slug: featureData.slug,
        subscriptionId,
        value: featureData.value
      });

      this.logger.info('Subscription feature added successfully', { featureId: feature.id });

      return {
        success: true,
        message: 'Subscription feature added successfully',
        data: feature
      };

    } catch (error) {
      this.logger.error('Failed to add subscription feature', error);
      return {
        success: false,
        message: 'Failed to add subscription feature',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update subscription feature
   */
  public async updateSubscriptionFeature(featureId: number, featureData: { slug?: string; value?: string }): Promise<ApiResponse<SubscriptionFeature>> {
    try {
      this.logger.info('Updating subscription feature', { featureId });

      const feature = await SubscriptionFeature.findByPk(featureId);
      if (!feature) {
        return {
          success: false,
          message: 'Subscription feature not found'
        };
      }

      // Update feature
      await feature.update(featureData);

      this.logger.info('Subscription feature updated successfully', { featureId });

      return {
        success: true,
        message: 'Subscription feature updated successfully',
        data: feature
      };

    } catch (error) {
      this.logger.error('Failed to update subscription feature', error);
      return {
        success: false,
        message: 'Failed to update subscription feature',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete subscription feature
   */
  public async deleteSubscriptionFeature(featureId: number): Promise<ApiResponse<void>> {
    try {
      this.logger.info('Deleting subscription feature', { featureId });

      const feature = await SubscriptionFeature.findByPk(featureId);
      if (!feature) {
        return {
          success: false,
          message: 'Subscription feature not found'
        };
      }

      // Delete feature
      await feature.destroy();

      this.logger.info('Subscription feature deleted successfully', { featureId });

      return {
        success: true,
        message: 'Subscription feature deleted successfully'
      };

    } catch (error) {
      this.logger.error('Failed to delete subscription feature', error);
      return {
        success: false,
        message: 'Failed to delete subscription feature',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get subscription statistics
   */
  public async getSubscriptionStats(): Promise<ApiResponse<any>> {
    try {
      const totalSubscriptions = await Subscription.count();
      const activeSubscriptions = await Subscription.count({
        where: { statusId: await this.getStatusIdBySlug('active') }
      });

      const totalUserSubscriptions = await UserSubscription.count();
      const activeUserSubscriptions = await UserSubscription.count({
        where: { statusId: await this.getUserSubscriptionStatusIdBySlug('active') }
      });

      const stats = {
        totalSubscriptions,
        activeSubscriptions,
        totalUserSubscriptions,
        activeUserSubscriptions
      };

      return {
        success: true,
        message: 'Subscription statistics retrieved successfully',
        data: stats
      };

    } catch (error) {
      this.logger.error('Failed to get subscription stats', error);
      return {
        success: false,
        message: 'Failed to retrieve subscription statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user subscription statistics
   */
  public async getUserSubscriptionStats(userId: number): Promise<ApiResponse<any>> {
    try {
      const totalUserSubscriptions = await UserSubscription.count({ where: { userId } });
      const activeUserSubscriptions = await UserSubscription.count({
        where: {
          userId,
          statusId: await this.getUserSubscriptionStatusIdBySlug('active')
        }
      });

      const stats = {
        userId,
        totalUserSubscriptions,
        activeUserSubscriptions
      };

      return {
        success: true,
        message: 'User subscription statistics retrieved successfully',
        data: stats
      };

    } catch (error) {
      this.logger.error('Failed to get user subscription stats', error);
      return {
        success: false,
        message: 'Failed to retrieve user subscription statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate user subscription access
   */
  public async validateUserSubscriptionAccess(userSubscriptionId: number, userId: number): Promise<boolean> {
    try {
      const userSubscription = await UserSubscription.findOne({
        where: { id: userSubscriptionId, userId }
      });

      return !!userSubscription;
    } catch (error) {
      this.logger.error('Failed to validate user subscription access', error);
      return false;
    }
  }

  /**
   * Helper method to get status ID by slug
   */
  private async getStatusIdBySlug(slug: string): Promise<number> {
    const status = await SubscriptionStatus.findOne({ where: { slug } });
    return status?.id || 1; // Default to first status
  }

  /**
   * Helper method to get user subscription status ID by slug
   */
  private async getUserSubscriptionStatusIdBySlug(slug: string): Promise<number> {
    const status = await UserSubscriptionStatus.findOne({ where: { slug } });
    return status?.id || 1; // Default to first status
  }
}

export default SubscriptionService;
