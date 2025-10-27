import User from '../models/User';
import UserRole from '../models/UserRole';
import Role from '../models/Role';
import UserStatus from '../models/UserStatus';
import UserActivity from '../models/UserActivity';
import Token from '../models/Token';
import TokenType from '../models/TokenType';
import { ConfigService } from '../config/ConfigService';
import Logger from '../utils/logger';
import { Op } from 'sequelize';
import crypto from 'crypto';
import { 
  CreateUserRequest, 
  UpdateUserRequest, 
  PaginationQuery,
  FilterQuery,
  ApiResponse,
  PaginatedResponse,
  FormattedUserResponse
} from '../types';

export interface UserServiceInterface {
  createUser(userData: CreateUserRequest): Promise<ApiResponse<FormattedUserResponse>>;
  getUserById(user_id: number): Promise<ApiResponse<User>>;
  getAllUsers(pagination?: PaginationQuery, filters?: FilterQuery): Promise<ApiResponse<{ users: any[]; pagination: { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number } }>>;
  updateUser(user_id: number, userData: UpdateUserRequest): Promise<ApiResponse<User>>;
  deleteUser(user_id: number): Promise<ApiResponse<void>>;
  requestDeleteProfile(user_id: number): Promise<ApiResponse<{ expiresAt: Date }>>;
  confirmDeleteProfile(user_id: number, token: string, password: string, confirmation: string): Promise<ApiResponse<void>>;
  getUserRoles(user_id: number): Promise<ApiResponse<Role[]>>;
  assignRole(user_id: number, role_id: number): Promise<ApiResponse<void>>;
  removeRole(user_id: number, role_id: number): Promise<ApiResponse<void>>;
  getUserActivities(user_id: number, pagination?: PaginationQuery): Promise<PaginatedResponse<UserActivity>>;
  logUserActivity(user_id: number, slug: string, description: string): Promise<ApiResponse<void>>;
  searchUsers(searchTerm: string, pagination?: PaginationQuery): Promise<PaginatedResponse<User>>;
  getUsersByRole(roleSlug: string, pagination?: PaginationQuery): Promise<PaginatedResponse<User>>;
  getUsersByStatus(statusSlug: string, pagination?: PaginationQuery): Promise<PaginatedResponse<User>>;
  toggleUserStatus(user_id: number): Promise<ApiResponse<User>>;
  getUserStats(): Promise<ApiResponse<any>>;
}

export class UserService implements UserServiceInterface {
  private static instance: UserService;
  private configService: ConfigService;
  private logger: typeof Logger;

  private constructor() {
    this.configService = ConfigService.getInstance();
    this.logger = Logger;
  }

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Create a new user
   */
  public async createUser(userData: CreateUserRequest): Promise<ApiResponse<FormattedUserResponse>> {
    try {
      this.logger.info('Creating new user', { email: userData.email });

      // Check if user already exists
      const existingUser = await User.findOne({
        where: { email: userData.email }
      });

      

      if (existingUser) {
        return {
          success: false,
          message: 'User with this email already exists'
        };
      }

      const passwordValidation = this.validatePassword(userData.password);
      if (!passwordValidation.isValid) {
        this.logger.warn('Password validation failed', { errors: passwordValidation.errors });
        return {
          success: false,
          message: 'Invalid password format',
          error: passwordValidation.errors.join(', ')
        };
      }

      
      const hashedPassword = await User.hashPassword(userData.password);

      var existingRole = await this.getRoleIdBySlug(userData.role);
      var roleIdFound = existingRole;
      
      if (existingRole == null) {
        roleIdFound = await this.getRoleIdBySlug("user");
      }

      

      const defaultStatus = await UserStatus.findOne({ where: { slug: 'active' } });
      const defaultStatusId = defaultStatus ? defaultStatus.id : 1;

      // Create user
      const user = await User.create({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        phone_number: userData.phone_number ??"+0000000000",
        status_id: defaultStatusId, // Default to 'active' status (fallback to 1 if not found)
        free_trial: userData.freeTrial ?? true,
        email_verified: false
      });

      this.logger.info('User created successfully', { user: user});

      // Assign role if provided
      if (roleIdFound) {
        await UserRole.create({
          user_id: user.id,
          role_id: roleIdFound
        });
      }

      // Log activity
      await this.logUserActivity(user.id, 'user_created', `User ${user.name} was created`);

      this.logger.info('User created successfully', { user_id: user.id });

      // Determine role slug for response (fallback to 'user')
      let roleSlug = 'user';
      try {
        if (roleIdFound) {
          const roleObj = await Role.findByPk(roleIdFound);
          if (roleObj && roleObj.slug) roleSlug = roleObj.slug;
        }
      } catch (err) {
        this.logger.warn('Failed to determine role slug for response', err);
      }

      // Determine status slug for response (use defaultStatus if available)
      const statusSlug = defaultStatus && defaultStatus.slug ? defaultStatus.slug : 'active';

      // Build formatted response object
      const responseData: FormattedUserResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone_number && user.phone_number !== '' ? user.phone_number : null,
        role: roleSlug,
        status: statusSlug,
        emailVerified: typeof user.email_verified === 'boolean' ? user.email_verified : false,
        createdAt: user.createdAt
      };

      return {
        success: true,
        message: 'User created successfully',
        data: responseData
      };

    } catch (error) {
      this.logger.error('Failed to create user', error);
      return {
        success: false,
        message: 'Failed to create user',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user by ID with relations
   */
  public async getUserById(user_id: number): Promise<ApiResponse<User>> {
    try {
      const user = await User.findByPk(user_id, {
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
        return {
          success: false,
          message: 'User not found'
        };
      }

      return {
        success: true,
        message: 'User retrieved successfully',
        data: user
      };

    } catch (error) {
      this.logger.error('Failed to get user by ID', error);
      return {
        success: false,
        message: 'Failed to retrieve user',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all users with pagination and filters
   */
  public async getAllUsers(pagination: PaginationQuery = {}, filters: FilterQuery = {}): Promise<ApiResponse<{ users: any[]; pagination: { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number } }>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;
      // Normalize sortBy values from the API to actual DB columns.
      // Acceptable inputs: 'createdAt', 'created_at', 'name', 'email' (case-insensitive)
      const rawSort = (pagination.sortBy || 'createdAt').toString();
      const sortOrder = (pagination.sortOrder || 'DESC') as 'ASC' | 'DESC';

      let sortBy: string;
      const rawLower = rawSort.toLowerCase();
      if (rawLower === 'createdat' || rawLower === 'created_at') {
        sortBy = 'created_at';
      } else if (rawLower === 'name') {
        sortBy = 'name';
      } else if (rawLower === 'email') {
        sortBy = 'email';
      } else {
        // Fallback to created_at if unknown
        sortBy = 'created_at';
      }

      // Build where clause
      const whereClause: any = {};
      
      if (filters.search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${filters.search}%` } },
          { email: { [Op.like]: `%${filters.search}%` } },
          { phone_number: { [Op.like]: `%${filters.search}%` } }
        ];
      }

      if (filters.status) {
        // Convert status slug to id; if not found, return a clear error immediately
        const statusId = await this.getStatusIdBySlug(filters.status);
        if (!statusId) {
          return {
            success: false,
            message: 'Failed to retrieve users',
            error: `No users found with status '${filters.status}'`,
            data: {
              users: [],
              pagination: {
                currentPage: page,
                totalPages: 0,
                totalItems: 0,
                itemsPerPage: limit
              }
            }
          };
        }

        whereClause.status_id = statusId;
      } else if ((filters as any).status_id) {
        // Accept numeric status_id as fallback
        whereClause.status_id = (filters as any).status_id;
      }

      // Build role filter if provided. When a role filter is present we make the include required
      // so Sequelize performs an inner join and only returns users that have that role.
      const roleInclude: any = {
        model: Role,
        as: 'Roles',
        through: { attributes: [] },
        required: !!filters.role
      };

      if (filters.role) {
        roleInclude.where = { slug: filters.role };
      }

      // Get users with pagination
      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        include: [
          roleInclude,
          {
            model: UserStatus,
            as: 'UserStatus'
          }
        ],
        limit,
        offset,
        order: [[sortBy, sortOrder]]
      });

      const totalPages = Math.ceil(count / limit);

      // If a search/role/status filter was provided and there are no matches, return a specific error
      if ((filters.search || filters.role || filters.status) && count === 0) {
        let errorMessage = 'No users found matching the provided filter(s)';
        if (filters.role) errorMessage = `No users found with role '${filters.role}'`;
        else if (filters.status) errorMessage = `No users found with status '${filters.status}'`;
        else if (filters.search) errorMessage = 'No users found matching search criteria';
        throw new Error(errorMessage);
      }

      // Map DB rows to the public API shape
      const users = rows.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone_number ? (typeof u.phone_number === 'number' ? `+${u.phone_number}` : u.phone_number) : null,
        role: u.Roles && u.Roles[0] ? u.Roles[0].slug : 'user',
        status: u.UserStatus ? u.UserStatus.slug : null,
        emailVerified: typeof u.email_verified === 'boolean' ? u.email_verified : true,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      }));

      return {
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: count,
            itemsPerPage: limit
          }
        }
      };

    } catch (error) {
      this.logger.error('Failed to get all users', error);
      return {
        success: false,
        message: 'Failed to retrieve users',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          users: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: 10
          }
        }
      };
    }
  }

  /**
   * Update user
   */
  public async updateUser(user_id: number, userData: UpdateUserRequest): Promise<ApiResponse<User>> {
    try {
      this.logger.info('Updating user', { user_id });

      const user = await User.findByPk(user_id);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Update user
      await user.update(userData);

      // Update role if provided
      if (userData.roleId) {
        await UserRole.destroy({ where: { user_id } });
        await UserRole.create({ user_id, role_id: userData.roleId });
      }

      // Log activity
      await this.logUserActivity(user_id, 'user_updated', `User ${user.name} was updated`);

      const updatedUser = await this.getUserById(user_id);
      
      return {
        success: true,
        message: 'User updated successfully',
        data: updatedUser.data!
      };

    } catch (error) {
      this.logger.error('Failed to update user', error);
      return {
        success: false,
        message: 'Failed to update user',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update authenticated user's own profile
   */
  public async updateProfile(user_id: number, profileData: Partial<{ name: string; phone_number: string }>): Promise<ApiResponse<User>> {
    try {
      this.logger.info('Updating user profile', { user_id });

      const user = await User.findByPk(user_id);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      const allowedFields: Array<keyof typeof profileData> = ['name', 'phone_number'];
      const dataToUpdate: any = {};
      for (const key of allowedFields) {
        if (profileData[key] !== undefined) {
          dataToUpdate[key] = profileData[key as keyof typeof profileData];
        }
      }

      await user.update(dataToUpdate);
      await this.logUserActivity(user_id, 'profile_updated', `User ${user.name} updated own profile`);

      const updatedUser = await this.getUserById(user_id);

      return {
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser.data!
      };

    } catch (error) {
      this.logger.error('Failed to update profile', error);
      return {
        success: false,
        message: 'Failed to update profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete user
   */
  public async deleteUser(user_id: number): Promise<ApiResponse<void>> {
    try {
      this.logger.info('Deleting user', { user_id });

      const user = await User.findByPk(user_id);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }
      // Delete user
      await user.destroy();

      this.logger.info('User deleted successfully', { user_id });

      return {
        success: true,
        message: 'User deleted successfully'
      };

    } catch (error) {
      this.logger.error('Failed to delete user', error);
      return {
        success: false,
        message: 'Failed to delete user',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Request to delete authenticated users own profile
   */
  public async requestDeleteProfile(user_id: number): Promise<ApiResponse<{ expiresAt: Date }>> {
    try {
      this.logger.info('Requesting profile deletion', { user_id });

      const user = await User.findByPk(user_id);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          error: 'User not found'
        };
      }

      const adminRole = await Role.findOne({ where: { slug: 'admin' } });
      if (adminRole) {
        const userHasAdminRole = await UserRole.findOne({
          where: { 
            user_id: user_id,
            role_id: adminRole.id
          }
        });

        if (userHasAdminRole) {
          this.logger.warn('Admin attempted to request profile deletion', { user_id });
          return {
            success: false,
            message: 'Admin users cannot delete their own accounts',
            error: 'Admin cannot delete own account'
          };
        }
      }

      const deleteToken = crypto.randomBytes(5).toString('hex').toUpperCase();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

      let tokenType = await TokenType.findOne({ where: { slug: 'delete_account' } });
      if (!tokenType) {
        tokenType = await TokenType.create({
          slug: 'delete_account',
          description: 'Token para confirmar eliminación de cuenta'
        });
      }

      await Token.destroy({
        where: {
          user_id: user_id,
          token_type_id: tokenType.id
        }
      });

      await Token.create({
        user_id: user_id,
        token_type_id: tokenType.id,
        value: deleteToken
      });

      const appConfig = this.configService.getAppConfig();
      
      this.logger.info('Delete account token generated', {
        user_id,
        token: deleteToken,
        expiresAt,
        email: user.email,
      });

      try {
        const emailService = (await import('./EmailService')).default;
        await emailService.sendAccountDeletionRequestEmail(user.email, user.name, deleteToken, expiresAt);
      } catch (error) {
        this.logger.error('Failed to send deletion request email', error);
      }

      return {
        success: true,
        message: 'Profile deletion requested. Please check your email to confirm.',
        data: {
          expiresAt
        }
      };

    } catch (error) {
      this.logger.error('Failed to request profile deletion', error);
      return {
        success: false,
        message: 'Failed to request profile deletion',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Confirm and execute profile deletion with token, password and confirmation
   */
  public async confirmDeleteProfile(user_id: number, token: string, password: string, confirmation: string): Promise<ApiResponse<void>> {
    try {
      this.logger.info('Confirming profile deletion', { user_id });

      // Verify confirmation word
      if (confirmation !== 'DELETE') {
        return {
          success: false,
          message: 'Confirmation must be "DELETE"',
          error: 'Invalid confirmation'
        };
      }

      const user = await User.findByPk(user_id);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          error: 'User not found'
        };
      }

      // Verify password
      const isPasswordValid = await user.verifyPassword(password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid password',
          error: 'Invalid password'
        };
      }

      const tokenType = await TokenType.findOne({ where: { slug: 'delete_account' } });
      if (!tokenType) {
        return {
          success: false,
          message: 'Invalid token',
          error: 'Token type not found'
        };
      }

      const storedToken = await Token.findOne({
        where: {
          user_id: user_id,
          token_type_id: tokenType.id,
          value: token
        }
      });

      if (!storedToken) {
        return {
          success: false,
          message: 'Invalid or expired token',
          error: 'Invalid or expired token'
        };
      }

      const tokenAge = Date.now() - storedToken.created_at.getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (tokenAge > twentyFourHours) {
        await storedToken.destroy();
        return {
          success: false,
          message: 'The token has expired. Please request a new one.',
          error: 'Token expired'
        };
      }

      const userEmail = user.email;
      const userName = user.name;

      await storedToken.destroy();

      const result = await this.deleteUser(user_id);
      
      if (result.success) {
        this.logger.info('Profile deleted successfully after confirmation', { user_id, email: userEmail });
        
        try {
          const emailService = (await import('./EmailService')).default;
          await emailService.sendAccountDeletionEmail(userEmail, userName);
        } catch (error) {
          this.logger.error('Failed to send account deletion email', error);
        }
      }

      return result;

    } catch (error) {
      this.logger.error('Failed to confirm profile deletion', error);
      return {
        success: false,
        message: 'Failed to confirm profile deletion',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user roles
   */
  public async getUserRoles(user_id: number): Promise<ApiResponse<Role[]>> {
    try {
      const userRoles = await UserRole.findAll({
        where: { user_id: user_id },
        include: [{ model: Role }]
      });

      const roles = userRoles.map((ur: any) => ur.Role).filter(Boolean);

      return {
        success: true,
        message: 'User roles retrieved successfully',
        data: roles as Role[]
      };

    } catch (error) {
      this.logger.error('Failed to get user roles', error);
      return {
        success: false,
        message: 'Failed to retrieve user roles',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Assign role to user
   */
  public async assignRole(user_id: number, role_id: number): Promise<ApiResponse<void>> {
    try {
      // Check if role already assigned
      const existingRole = await UserRole.findOne({
        where: { user_id: user_id, role_id }
      });

      if (existingRole) {
        return {
          success: false,
          message: 'Role already assigned to user'
        };
      }

      await UserRole.create({ user_id: user_id, role_id });

      // Log activity
      await this.logUserActivity(user_id, 'role_assigned', `Role assigned to user`);

      return {
        success: true,
        message: 'Role assigned successfully'
      };

    } catch (error) {
      this.logger.error('Failed to assign role', error);
      return {
        success: false,
        message: 'Failed to assign role',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Remove role from user
   */
  public async removeRole(user_id: number, role_id: number): Promise<ApiResponse<void>> {
    try {
      const deletedCount = await UserRole.destroy({
        where: { user_id: user_id, role_id }
      });

      if (deletedCount === 0) {
        return {
          success: false,
          message: 'Role not found for user'
        };
      }

      // Log activity
      await this.logUserActivity(user_id, 'role_removed', `Role removed from user`);

      return {
        success: true,
        message: 'Role removed successfully'
      };

    } catch (error) {
      this.logger.error('Failed to remove role', error);
      return {
        success: false,
        message: 'Failed to remove role',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user activities
   */
  public async getUserActivities(user_id: number, pagination: PaginationQuery = {}): Promise<PaginatedResponse<UserActivity>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;
      const sortBy = pagination.sortBy || 'created_at';
      const sortOrder = pagination.sortOrder || 'DESC';

      const { count, rows } = await UserActivity.findAndCountAll({
        where: { user_id },
        limit,
        offset,
        order: [[sortBy, sortOrder]]
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'User activities retrieved successfully',
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      };

    } catch (error) {
      this.logger.error('Failed to get user activities', error);
      return {
        success: false,
        message: 'Failed to retrieve user activities',
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
   * Log user activity
   */
  public async logUserActivity(user_id: number, slug: string, description: string): Promise<ApiResponse<void>> {
    try {
      await UserActivity.create({ user_id: user_id,
        slug,
        description
      });

      return {
        success: true,
        message: 'Activity logged successfully'
      };

    } catch (error) {
      this.logger.error('Failed to log user activity', error);
      return {
        success: false,
        message: 'Failed to log activity',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search users
   */
  public async searchUsers(searchTerm: string, pagination: PaginationQuery = {}): Promise<PaginatedResponse<User>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await User.findAndCountAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${searchTerm}%` } },
            { email: { [Op.like]: `%${searchTerm}%` } }
          ]
        },
        include: [
          {
            model: UserRole,
            include: [{ model: Role }]
          },
          {
            model: UserStatus
          }
        ],
        limit,
        offset,
        order: [['name', 'ASC']]
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'Search completed successfully',
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      };

    } catch (error) {
      this.logger.error('Failed to search users', error);
      return {
        success: false,
        message: 'Search failed',
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
   * Get users by role
   */
  public async getUsersByRole(roleSlug: string, pagination: PaginationQuery = {}): Promise<PaginatedResponse<User>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await User.findAndCountAll({
        include: [
          {
            model: UserRole,
            include: [{
              model: Role,
              where: { slug: roleSlug }
            }]
          },
          {
            model: UserStatus
          }
        ],
        limit,
        offset,
        order: [['name', 'ASC']]
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'Users retrieved successfully',
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      };

    } catch (error) {
      this.logger.error('Failed to get users by role', error);
      return {
        success: false,
        message: 'Failed to retrieve users',
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
   * Get users by status
   */
  public async getUsersByStatus(statusSlug: string, pagination: PaginationQuery = {}): Promise<PaginatedResponse<User>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;

      const statusId = await this.getStatusIdBySlug(statusSlug);
      if (!statusId) {
        return {
          success: false,
          message: 'Status not found',
          pagination: {
            page: pagination.page || 1,
            limit: pagination.limit || 10,
            total: 0,
            totalPages: 0
          }
        };
      }

      const { count, rows } = await User.findAndCountAll({
        where: { status_id: statusId },
        include: [
          {
            model: UserRole,
            include: [{ model: Role }]
          },
          {
            model: UserStatus
          }
        ],
        limit,
        offset,
        order: [['name', 'ASC']]
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'Users retrieved successfully',
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      };

    } catch (error) {
      this.logger.error('Failed to get users by status', error);
      return {
        success: false,
        message: 'Failed to retrieve users',
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
   * Get status ID by slug
   */
  private async getStatusIdBySlug(slug: string): Promise<number | null> {
    try {
      const status = await UserStatus.findOne({ where: { slug } });
      return status ? status.id : null;
    } catch (error) {
      this.logger.error('Failed to get status ID by slug', error);
      return null;
    }
  }

  /**
   * Toggle user status (active/inactive)
   */
  public async toggleUserStatus(user_id: number): Promise<ApiResponse<User>> {
    try {
      const user = await User.findByPk(user_id);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Toggle between active and inactive status
      const activeStatusId = await this.getStatusIdBySlug('active');
      const inactiveStatusId = await this.getStatusIdBySlug('inactive');
      
      if (!activeStatusId || !inactiveStatusId) {
        return {
          success: false,
          message: 'Status configuration error'
        };
      }

      const newStatusId = user.status_id === activeStatusId ? inactiveStatusId : activeStatusId;
      await user.update({ status_id: newStatusId });

      // Log activity
      const statusText = newStatusId === activeStatusId ? 'activated' : 'deactivated';
      await this.logUserActivity(user_id, 'status_toggled', `User ${statusText}`);

      const updatedUser = await this.getUserById(user_id);

      return {
        success: true,
        message: `User ${statusText} successfully`,
        data: updatedUser.data!
      };

    } catch (error) {
      this.logger.error('Failed to toggle user status', error);
      return {
        success: false,
        message: 'Failed to toggle user status',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user statistics
   */
  public async getUserStats(): Promise<ApiResponse<any>> {
    try {
      const totalUsers = await User.count();
      
      const activeStatusId = await this.getStatusIdBySlug('active');
      const inactiveStatusId = await this.getStatusIdBySlug('inactive');
      
      const activeUsers = activeStatusId ? await User.count({ where: { status_id: activeStatusId } }) : 0;
      const inactiveUsers = inactiveStatusId ? await User.count({ where: { status_id: inactiveStatusId } }) : 0;
      const freeTrialUsers = await User.count({ where: { free_trial: true } });

      // Get role distribution
      const roleStats = await UserRole.findAll({
        include: [{ 
          model: Role,
          as: 'Role'
        }],
        attributes: ['role_id'],
        group: ['role_id']
      });

      const stats = {
        totalUsers,
        activeUsers,
        inactiveUsers,
        freeTrialUsers,
        roleDistribution: roleStats.map((rs: any) => ({
          role: rs.Role?.slug,
          count: rs.count
        }))
      };

      return {
        success: true,
        message: 'User statistics retrieved successfully',
        data: stats
      };

    } catch (error) {
      this.logger.error('Failed to get user stats', error);
      return {
        success: false,
        message: 'Failed to retrieve user statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

    /**
   * Validate password strength
   */
  public validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }


  /**
   * Validate Role ID
   */
  private async getRoleIdBySlug(slug: string): Promise<number | null> {
    try {
        const role = await Role.findOne({ where: { slug } });
        return role ? role.id : null;
      } catch (error) {
        this.logger.error('Failed to get role ID by slug', error);
        return null;
      }
    }


  

  


}

export default UserService;
