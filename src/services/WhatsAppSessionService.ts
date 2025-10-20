import WhatsAppSession from '../models/WhatsAppSession';
import WhatsAppSessionStatus from '../models/WhatsAppSessionStatus';
import User from '../models/User';
import BrowserContext from '../models/BrowserContext';
import Message from '../models/Message';
import { ConfigService } from '../config/ConfigService';
import Logger from '../utils/logger';
import { Op } from 'sequelize';
import { 
  CreateWhatsAppSessionRequest,
  UpdateWhatsAppSessionRequest,
  PaginationQuery,
  FilterQuery,
  ApiResponse,
  PaginatedResponse 
} from '../types';

export interface WhatsAppSessionServiceInterface {
  createSession(sessionData: CreateWhatsAppSessionRequest): Promise<ApiResponse<WhatsAppSession>>;
  getSessionById(sessionId: number, userId: number): Promise<ApiResponse<WhatsAppSession>>;
  getUserSessions(userId: number, pagination?: PaginationQuery, filters?: FilterQuery): Promise<PaginatedResponse<WhatsAppSession>>;
  updateSession(sessionId: number, userId: number, sessionData: UpdateWhatsAppSessionRequest): Promise<ApiResponse<WhatsAppSession>>;
  deleteSession(sessionId: number, userId: number): Promise<ApiResponse<void>>;
  getSessionStatus(sessionId: number, userId: number): Promise<ApiResponse<any>>;
  connectSession(sessionId: number, userId: number): Promise<ApiResponse<void>>;
  disconnectSession(sessionId: number, userId: number): Promise<ApiResponse<void>>;
  getSessionMessages(sessionId: number, userId: number, pagination?: PaginationQuery): Promise<PaginatedResponse<Message>>;
  getSessionStats(sessionId: number, userId: number): Promise<ApiResponse<any>>;
  getAllSessions(pagination?: PaginationQuery, filters?: FilterQuery): Promise<PaginatedResponse<WhatsAppSession>>;
  getSessionsByStatus(statusSlug: string, pagination?: PaginationQuery): Promise<PaginatedResponse<WhatsAppSession>>;
  getSessionsByUser(userId: number, pagination?: PaginationQuery): Promise<PaginatedResponse<WhatsAppSession>>;
  getSessionCountByUser(userId: number): Promise<ApiResponse<number>>;
  validateSessionOwnership(sessionId: number, userId: number): Promise<boolean>;
}

export class WhatsAppSessionService implements WhatsAppSessionServiceInterface {
  private static instance: WhatsAppSessionService;
  private configService: ConfigService;
  private logger: typeof Logger;

  private constructor() {
    this.configService = ConfigService.getInstance();
    this.logger = Logger;
  }

  public static getInstance(): WhatsAppSessionService {
    if (!WhatsAppSessionService.instance) {
      WhatsAppSessionService.instance = new WhatsAppSessionService();
    }
    return WhatsAppSessionService.instance;
  }

  /**
   * Create a new WhatsApp session
   */
  public async createSession(sessionData: CreateWhatsAppSessionRequest): Promise<ApiResponse<WhatsAppSession>> {
    try {
      this.logger.info('Creating WhatsApp session', { userId: sessionData.userId, phoneNumber: sessionData.phoneNumber });

      // Validate phone number format
      if (!this.isValidPhoneNumber(sessionData.phoneNumber)) {
        return {
          success: false,
          message: 'Invalid phone number format'
        };
      }

      // Check if user already has a session with this phone number
      const existingSession = await WhatsAppSession.findOne({
        where: {
          userId: sessionData.userId,
          phoneNumber: sessionData.phoneNumber
        }
      });

      if (existingSession) {
        return {
          success: false,
          message: 'Session with this phone number already exists'
        };
      }

      // Create session
      const createData: any = {
        userId: sessionData.userId,
        phoneNumber: sessionData.phoneNumber,
        statusId: sessionData.statusId,
        accountProtection: sessionData.accountProtection,
        logMessages: sessionData.logMessages,
        webhookEnabled: sessionData.webhookEnabled,
        browserContextId: sessionData.browserContextId
      };

      if (sessionData.webhookUrl) {
        createData.webhookUrl = sessionData.webhookUrl;
      }

      const session = await WhatsAppSession.create(createData);

      // Get session with relations
      const sessionWithRelations = await this.getSessionById(session.id, sessionData.userId);

      this.logger.info('WhatsApp session created successfully', { sessionId: session.id });

      return {
        success: true,
        message: 'WhatsApp session created successfully',
        data: sessionWithRelations.data!
      };

    } catch (error) {
      this.logger.error('Failed to create WhatsApp session', error);
      return {
        success: false,
        message: 'Failed to create WhatsApp session',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get session by ID
   */
  public async getSessionById(sessionId: number, userId: number): Promise<ApiResponse<WhatsAppSession>> {
    try {
      const session = await WhatsAppSession.findOne({
        where: { id: sessionId, userId },
        include: [
          {
            model: User
          },
          {
            model: WhatsAppSessionStatus
          },
          {
            model: BrowserContext
          }
        ]
      });

      if (!session) {
        return {
          success: false,
          message: 'Session not found or access denied'
        };
      }

      return {
        success: true,
        message: 'Session retrieved successfully',
        data: session
      };

    } catch (error) {
      this.logger.error('Failed to get session by ID', error);
      return {
        success: false,
        message: 'Failed to retrieve session',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user sessions with pagination and filters
   */
  public async getUserSessions(userId: number, pagination: PaginationQuery = {}, filters: FilterQuery = {}): Promise<PaginatedResponse<WhatsAppSession>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;
      const sortBy = pagination.sortBy || 'createdAt';
      const sortOrder = pagination.sortOrder || 'DESC';

      // Build where clause
      const whereClause: any = { userId };
      
      if (filters.search) {
        whereClause.phoneNumber = { [Op.like]: `%${filters.search}%` };
      }

      if (filters.status) {
        whereClause.statusId = await this.getStatusIdBySlug(filters.status);
      }

      // Get sessions with pagination
      const { count, rows } = await WhatsAppSession.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User
          },
          {
            model: WhatsAppSessionStatus
          },
          {
            model: BrowserContext
          }
        ],
        limit,
        offset,
        order: [[sortBy, sortOrder]]
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'Sessions retrieved successfully',
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      };

    } catch (error) {
      this.logger.error('Failed to get user sessions', error);
      return {
        success: false,
        message: 'Failed to retrieve sessions',
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
   * Update session
   */
  public async updateSession(sessionId: number, userId: number, sessionData: UpdateWhatsAppSessionRequest): Promise<ApiResponse<WhatsAppSession>> {
    try {
      this.logger.info('Updating WhatsApp session', { sessionId, userId });

      // Validate ownership
      const ownershipValid = await this.validateSessionOwnership(sessionId, userId);
      if (!ownershipValid) {
        return {
          success: false,
          message: 'Session not found or access denied'
        };
      }

      const session = await WhatsAppSession.findByPk(sessionId);
      if (!session) {
        return {
          success: false,
          message: 'Session not found'
        };
      }

      // Validate phone number if provided
      if (sessionData.phoneNumber && !this.isValidPhoneNumber(sessionData.phoneNumber)) {
        return {
          success: false,
          message: 'Invalid phone number format'
        };
      }

      // Update session
      await session.update(sessionData);

      const updatedSession = await this.getSessionById(sessionId, userId);

      this.logger.info('WhatsApp session updated successfully', { sessionId });

      return {
        success: true,
        message: 'Session updated successfully',
        data: updatedSession.data!
      };

    } catch (error) {
      this.logger.error('Failed to update session', error);
      return {
        success: false,
        message: 'Failed to update session',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete session
   */
  public async deleteSession(sessionId: number, userId: number): Promise<ApiResponse<void>> {
    try {
      this.logger.info('Deleting WhatsApp session', { sessionId, userId });

      // Validate ownership
      const ownershipValid = await this.validateSessionOwnership(sessionId, userId);
      if (!ownershipValid) {
        return {
          success: false,
          message: 'Session not found or access denied'
        };
      }

      const session = await WhatsAppSession.findByPk(sessionId);
      if (!session) {
        return {
          success: false,
          message: 'Session not found'
        };
      }

      // Delete related messages first
      await Message.destroy({ where: { whatsappSessionId: sessionId } });

      // Delete session
      await session.destroy();

      this.logger.info('WhatsApp session deleted successfully', { sessionId });

      return {
        success: true,
        message: 'Session deleted successfully'
      };

    } catch (error) {
      this.logger.error('Failed to delete session', error);
      return {
        success: false,
        message: 'Failed to delete session',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get session status
   */
  public async getSessionStatus(sessionId: number, userId: number): Promise<ApiResponse<any>> {
    try {
      const sessionResponse = await this.getSessionById(sessionId, userId);
      if (!sessionResponse.success || !sessionResponse.data) {
        return {
          success: false,
          message: 'Session not found'
        };
      }

      const session = sessionResponse.data;
      const messageCount = await Message.count({ where: { whatsappSessionId: sessionId } });

      const status = {
        id: session.id,
        phoneNumber: session.phoneNumber,
        status: session.WhatsAppSessionStatus?.slug || 'unknown',
        accountProtection: session.accountProtection,
        logMessages: session.logMessages,
        webhookEnabled: session.webhookEnabled,
        messageCount,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      };

      return {
        success: true,
        message: 'Session status retrieved successfully',
        data: status
      };

    } catch (error) {
      this.logger.error('Failed to get session status', error);
      return {
        success: false,
        message: 'Failed to retrieve session status',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Connect session
   */
  public async connectSession(sessionId: number, userId: number): Promise<ApiResponse<void>> {
    try {
      this.logger.info('Connecting WhatsApp session', { sessionId, userId });

      // Validate ownership
      const ownershipValid = await this.validateSessionOwnership(sessionId, userId);
      if (!ownershipValid) {
        return {
          success: false,
          message: 'Session not found or access denied'
        };
      }

      // Update session status to connecting
      await WhatsAppSession.update(
        { statusId: await this.getStatusIdBySlug('connecting') },
        { where: { id: sessionId } }
      );

      // TODO: Implement actual WhatsApp connection logic
      // This would typically involve:
      // 1. Initialize WhatsApp client
      // 2. Generate QR code if needed
      // 3. Handle connection events

      this.logger.info('WhatsApp session connection initiated', { sessionId });

      return {
        success: true,
        message: 'Session connection initiated'
      };

    } catch (error) {
      this.logger.error('Failed to connect session', error);
      return {
        success: false,
        message: 'Failed to connect session',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Disconnect session
   */
  public async disconnectSession(sessionId: number, userId: number): Promise<ApiResponse<void>> {
    try {
      this.logger.info('Disconnecting WhatsApp session', { sessionId, userId });

      // Validate ownership
      const ownershipValid = await this.validateSessionOwnership(sessionId, userId);
      if (!ownershipValid) {
        return {
          success: false,
          message: 'Session not found or access denied'
        };
      }

      // Update session status to disconnected
      await WhatsAppSession.update(
        { statusId: await this.getStatusIdBySlug('disconnected') },
        { where: { id: sessionId } }
      );

      // TODO: Implement actual WhatsApp disconnection logic
      // This would typically involve:
      // 1. Close WhatsApp client
      // 2. Clean up resources
      // 3. Handle disconnection events

      this.logger.info('WhatsApp session disconnected', { sessionId });

      return {
        success: true,
        message: 'Session disconnected successfully'
      };

    } catch (error) {
      this.logger.error('Failed to disconnect session', error);
      return {
        success: false,
        message: 'Failed to disconnect session',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get session messages
   */
  public async getSessionMessages(sessionId: number, userId: number, pagination: PaginationQuery = {}): Promise<PaginatedResponse<Message>> {
    try {
      // Validate ownership
      const ownershipValid = await this.validateSessionOwnership(sessionId, userId);
      if (!ownershipValid) {
        return {
          success: false,
          message: 'Session not found or access denied',
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
          }
        };
      }

      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;
      const sortBy = pagination.sortBy || 'sentAt';
      const sortOrder = pagination.sortOrder || 'DESC';

      const { count, rows } = await Message.findAndCountAll({
        where: { whatsappSessionId: sessionId },
        limit,
        offset,
        order: [[sortBy, sortOrder]]
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'Messages retrieved successfully',
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      };

    } catch (error) {
      this.logger.error('Failed to get session messages', error);
      return {
        success: false,
        message: 'Failed to retrieve messages',
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
   * Get session statistics
   */
  public async getSessionStats(sessionId: number, userId: number): Promise<ApiResponse<any>> {
    try {
      // Validate ownership
      const ownershipValid = await this.validateSessionOwnership(sessionId, userId);
      if (!ownershipValid) {
        return {
          success: false,
          message: 'Session not found or access denied'
        };
      }

      const totalMessages = await Message.count({ where: { whatsappSessionId: sessionId } });
      const messagesToday = await Message.count({
        where: {
          whatsappSessionId: sessionId,
          sentAt: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      });

      const stats = {
        sessionId,
        totalMessages,
        messagesToday,
        createdAt: (await WhatsAppSession.findByPk(sessionId))?.createdAt
      };

      return {
        success: true,
        message: 'Session statistics retrieved successfully',
        data: stats
      };

    } catch (error) {
      this.logger.error('Failed to get session stats', error);
      return {
        success: false,
        message: 'Failed to retrieve session statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all sessions (admin)
   */
  public async getAllSessions(pagination: PaginationQuery = {}, filters: FilterQuery = {}): Promise<PaginatedResponse<WhatsAppSession>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;
      const sortBy = pagination.sortBy || 'createdAt';
      const sortOrder = pagination.sortOrder || 'DESC';

      // Build where clause
      const whereClause: any = {};
      
      if (filters.search) {
        whereClause.phoneNumber = { [Op.like]: `%${filters.search}%` };
      }

      if (filters.status) {
        whereClause.statusId = await this.getStatusIdBySlug(filters.status);
      }

      if (filters.userId) {
        whereClause.userId = filters.userId;
      }

      const { count, rows } = await WhatsAppSession.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User
          },
          {
            model: WhatsAppSessionStatus
          },
          {
            model: BrowserContext
          }
        ],
        limit,
        offset,
        order: [[sortBy, sortOrder]]
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'Sessions retrieved successfully',
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      };

    } catch (error) {
      this.logger.error('Failed to get all sessions', error);
      return {
        success: false,
        message: 'Failed to retrieve sessions',
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
   * Get sessions by status
   */
  public async getSessionsByStatus(statusSlug: string, pagination: PaginationQuery = {}): Promise<PaginatedResponse<WhatsAppSession>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;

      const statusId = await this.getStatusIdBySlug(statusSlug);

      const { count, rows } = await WhatsAppSession.findAndCountAll({
        where: { statusId },
        include: [
          {
            model: User
          },
          {
            model: WhatsAppSessionStatus
          },
          {
            model: BrowserContext
          }
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'Sessions retrieved successfully',
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      };

    } catch (error) {
      this.logger.error('Failed to get sessions by status', error);
      return {
        success: false,
        message: 'Failed to retrieve sessions',
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
   * Get sessions by user
   */
  public async getSessionsByUser(userId: number, pagination: PaginationQuery = {}): Promise<PaginatedResponse<WhatsAppSession>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await WhatsAppSession.findAndCountAll({
        where: { userId },
        include: [
          {
            model: User
          },
          {
            model: WhatsAppSessionStatus
          },
          {
            model: BrowserContext
          }
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'Sessions retrieved successfully',
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      };

    } catch (error) {
      this.logger.error('Failed to get sessions by user', error);
      return {
        success: false,
        message: 'Failed to retrieve sessions',
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
   * Get session count by user
   */
  public async getSessionCountByUser(userId: number): Promise<ApiResponse<number>> {
    try {
      const count = await WhatsAppSession.count({ where: { userId } });

      return {
        success: true,
        message: 'Session count retrieved successfully',
        data: count
      };

    } catch (error) {
      this.logger.error('Failed to get session count', error);
      return {
        success: false,
        message: 'Failed to retrieve session count',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate session ownership
   */
  public async validateSessionOwnership(sessionId: number, userId: number): Promise<boolean> {
    try {
      const session = await WhatsAppSession.findOne({
        where: { id: sessionId, userId }
      });

      return !!session;
    } catch (error) {
      this.logger.error('Failed to validate session ownership', error);
      return false;
    }
  }

  /**
   * Validate phone number format
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic phone number validation - can be enhanced
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Helper method to get status ID by slug
   */
  private async getStatusIdBySlug(slug: string): Promise<number> {
    const status = await WhatsAppSessionStatus.findOne({ where: { slug } });
    return status?.id || 1; // Default to first status
  }
}

export default WhatsAppSessionService;
