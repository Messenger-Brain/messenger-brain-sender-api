import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import UserRole from '../models/UserRole';
import Role from '../models/Role';
import UserStatus from '../models/UserStatus';
import { ConfigService } from '../config/ConfigService';
import Logger from '../utils/logger';
import { 
  CreateUserRequest, 
  UpdateUserRequest, 
  LoginRequest, 
  AuthResponse,
  JWTPayload,
  ApiResponse 
} from '../types';

export interface AuthServiceInterface {
  register(userData: CreateUserRequest): Promise<AuthResponse>;
  login(loginData: LoginRequest): Promise<AuthResponse>;
  getUserById(userId: number): Promise<User | null>;
  updateUser(userId: number, userData: UpdateUserRequest): Promise<ApiResponse<User>>;
  deleteUser(userId: number): Promise<ApiResponse<void>>;
  verifyToken(token: string): JWTPayload | null;
  refreshToken(refreshToken: string): Promise<AuthResponse>;
  logout(userId: number): Promise<ApiResponse<void>>;
  changePassword(userId: number, currentPassword: string, newPassword: string): Promise<ApiResponse<void>>;
  resetPassword(email: string): Promise<ApiResponse<void>>;
  validatePassword(password: string): { isValid: boolean; errors: string[] };
}

export class AuthService implements AuthServiceInterface {
  private static instance: AuthService;
  private configService: ConfigService;
  private logger: typeof Logger;

  private constructor() {
    this.configService = ConfigService.getInstance();
    this.logger = Logger;
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Register a new user
   */
  public async register(userData: CreateUserRequest): Promise<AuthResponse> {
    try {
      this.logger.info('Starting user registration', { email: userData.email });

      // Validate password
      const passwordValidation = this.validatePassword(userData.password);
      if (!passwordValidation.isValid) {
        this.logger.warn('Password validation failed', { errors: passwordValidation.errors });
        return {
          success: false,
          message: 'Invalid password format',
          error: passwordValidation.errors.join(', ')
        };
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        this.logger.warn('User registration failed - email already exists', { email: userData.email });
        return {
          success: false,
          message: 'User with this email already exists'
        };
      }

      // Hash password
      const hashedPassword = await User.hashPassword(userData.password);

      // Create user
      const user = await User.create({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        statusId: userData.statusId,
        freeTrial: userData.freeTrial ?? false
      });

      // Assign role if provided
      if (userData.roleId) {
        await UserRole.create({
          userId: user.id,
          roleId: userData.roleId
        });
      }

      // Get user with relations
      const userWithRelations = await this.getUserById(user.id);
      if (!userWithRelations) {
        throw new Error('Failed to retrieve created user');
      }

      // Generate tokens
      const token = this.generateToken(userWithRelations);
      const refreshToken = this.generateRefreshToken(userWithRelations);

      this.logger.info('User registered successfully', { userId: user.id, email: user.email });

      return {
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: 'user', // Default role
            status: 'active', // Default status
            freeTrial: user.freeTrial
          },
          token,
          refreshToken
        }
      };

    } catch (error) {
      this.logger.error('User registration failed', error);
      return {
        success: false,
        message: 'Registration failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Login user
   */
  public async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      this.logger.info('Starting user login', { email: loginData.email });

      // Find user with relations
      const user = await User.findOne({
        where: { email: loginData.email },
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
        this.logger.warn('Login failed - user not found', { email: loginData.email });
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Verify password
      const isPasswordValid = await user.verifyPassword(loginData.password);
      if (!isPasswordValid) {
        this.logger.warn('Login failed - invalid password', { email: loginData.email });
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      // Check user status
      if (user.statusId !== 1) { // Assuming 1 is active status
        this.logger.warn('Login failed - user inactive', { email: loginData.email, statusId: user.statusId });
        return {
          success: false,
          message: 'Account is inactive'
        };
      }

      // Generate tokens
      const token = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user);

      this.logger.authEvent('login', user.id, true);

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.UserRoles?.[0]?.Role?.slug || 'user',
            status: user.UserStatus?.slug || 'active',
            freeTrial: user.freeTrial
          },
          token,
          refreshToken
        }
      };

    } catch (error) {
      this.logger.error('Login failed', error);
      return {
        success: false,
        message: 'Login failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user by ID with relations
   */
  public async getUserById(userId: number): Promise<User | null> {
    try {
      const user = await User.findByPk(userId, {
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

      return user;
    } catch (error) {
      this.logger.error('Failed to get user by ID', error);
      return null;
    }
  }

  /**
   * Update user
   */
  public async updateUser(userId: number, userData: UpdateUserRequest): Promise<ApiResponse<User>> {
    try {
      this.logger.info('Starting user update', { userId });

      const user = await User.findByPk(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Hash password if provided
      if (userData.password) {
        const passwordValidation = this.validatePassword(userData.password);
        if (!passwordValidation.isValid) {
          return {
            success: false,
            message: 'Invalid password format',
            error: passwordValidation.errors.join(', ')
          };
        }
        userData.password = await User.hashPassword(userData.password);
      }

      // Update user
      await user.update(userData);

      // Update role if provided
      if (userData.roleId) {
        await UserRole.destroy({ where: { userId } });
        await UserRole.create({ userId, roleId: userData.roleId });
      }

      const updatedUser = await this.getUserById(userId);
      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user');
      }

      this.logger.info('User updated successfully', { userId });

      return {
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      };

    } catch (error) {
      this.logger.error('User update failed', error);
      return {
        success: false,
        message: 'Update failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete user
   */
  public async deleteUser(userId: number): Promise<ApiResponse<void>> {
    try {
      this.logger.info('Starting user deletion', { userId });

      const user = await User.findByPk(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Delete user roles first
      await UserRole.destroy({ where: { userId } });

      // Delete user
      await user.destroy();

      this.logger.info('User deleted successfully', { userId });

      return {
        success: true,
        message: 'User deleted successfully'
      };

    } catch (error) {
      this.logger.error('User deletion failed', error);
      return {
        success: false,
        message: 'Deletion failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify JWT token
   */
  public verifyToken(token: string): JWTPayload | null {
    try {
      const jwtConfig = this.configService.getJWTConfig();
      const decoded = jwt.verify(token, jwtConfig.secret) as JWTPayload;
      return decoded;
    } catch (error) {
      this.logger.warn('Token verification failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  /**
   * Refresh JWT token
   */
  public async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const jwtConfig = this.configService.getJWTConfig();
      const decoded = jwt.verify(refreshToken, jwtConfig.secret) as JWTPayload;

      const user = await this.getUserById(decoded.id);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      const newToken = this.generateToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.UserRoles?.[0]?.Role?.slug || 'user',
            status: user.UserStatus?.slug || 'active',
            freeTrial: user.freeTrial
          },
          token: newToken,
          refreshToken: newRefreshToken
        }
      };

    } catch (error) {
      this.logger.error('Token refresh failed', error);
      return {
        success: false,
        message: 'Token refresh failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Logout user
   */
  public async logout(userId: number): Promise<ApiResponse<void>> {
    try {
      this.logger.authEvent('logout', userId, true);
      
      return {
        success: true,
        message: 'Logout successful'
      };
    } catch (error) {
      this.logger.error('Logout failed', error);
      return {
        success: false,
        message: 'Logout failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Change user password
   */
  public async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    try {
      this.logger.info('Starting password change', { userId });

      const user = await User.findByPk(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await user.verifyPassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: 'Current password is incorrect'
        };
      }

      // Validate new password
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: 'Invalid new password format',
          error: passwordValidation.errors.join(', ')
        };
      }

      // Hash and update password
      const hashedPassword = await User.hashPassword(newPassword);
      await user.update({ password: hashedPassword });

      this.logger.info('Password changed successfully', { userId });

      return {
        success: true,
        message: 'Password changed successfully'
      };

    } catch (error) {
      this.logger.error('Password change failed', error);
      return {
        success: false,
        message: 'Password change failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Reset password (placeholder for future implementation)
   */
  public async resetPassword(email: string): Promise<ApiResponse<void>> {
    try {
      this.logger.info('Password reset requested', { email });

      // TODO: Implement password reset logic
      // This would typically involve:
      // 1. Generate reset token
      // 2. Send email with reset link
      // 3. Store reset token with expiration

      return {
        success: true,
        message: 'Password reset email sent (if user exists)'
      };

    } catch (error) {
      this.logger.error('Password reset failed', error);
      return {
        success: false,
        message: 'Password reset failed',
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
   * Generate JWT token
   */
  private generateToken(user: User): string {
    const jwtConfig = this.configService.getJWTConfig();
    const payload: JWTPayload = {
      id: user.id,
      email: user.email,
      role: user.UserRoles?.[0]?.Role?.slug || 'user',
      status: user.UserStatus?.slug || 'active'
    };

    return jwt.sign(payload, jwtConfig.secret, { expiresIn: '1h' });
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(user: User): string {
    const jwtConfig = this.configService.getJWTConfig();
    const payload: JWTPayload = {
      id: user.id,
      email: user.email,
      role: user.UserRoles?.[0]?.Role?.slug || 'user',
      status: user.UserStatus?.slug || 'active'
    };

    return jwt.sign(payload, jwtConfig.secret, { expiresIn: '7d' });
  }
}

export default AuthService;
