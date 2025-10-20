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
  getSessionById(sessionId: number, user_id: number): Promise<ApiResponse<WhatsAppSession>>;
  getUserSessions(user_id: number, pagination?: PaginationQuery, filters?: FilterQuery): Promise<PaginatedResponse<WhatsAppSession>>;
  updateSession(sessionId: number, user_id: number, sessionData: UpdateWhatsAppSessionRequest): Promise<ApiResponse<WhatsAppSession>>;
  deleteSession(sessionId: number, user_id: number): Promise<ApiResponse<void>>;
  getSessionStatus(sessionId: number, user_id: number): Promise<ApiResponse<any>>;
  connectSession(sessionId: number, user_id: number): Promise<ApiResponse<void>>;
  disconnectSession(sessionId: number, user_id: number): Promise<ApiResponse<void>>;
  getSessionMessages(sessionId: number, user_id: number, pagination?: PaginationQuery): Promise<PaginatedResponse<Message>>;
  getSessionStats(sessionId: number, user_id: number): Promise<ApiResponse<any>>;
  getAllSessions(pagination?: PaginationQuery, filters?: FilterQuery): Promise<PaginatedResponse<WhatsAppSession>>;
  getSessionsByStatus(statusSlug: string, pagination?: PaginationQuery): Promise<PaginatedResponse<WhatsAppSession>>;
  getSessionsByUser(user_id: number, pagination?: PaginationQuery): Promise<PaginatedResponse<WhatsAppSession>>;
  getSessionCountByUser(user_id: number): Promise<ApiResponse<number>>;
  validateSessionOwnership(sessionId: number, user_id: number): Promise<boolean>;
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
      this.logger.info('Creating WhatsApp session', { user_id: sessionData.userId, phone_number: sessionData.phoneNumber });

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
          user_id: sessionData.userId,
          phone_number: sessionData.phoneNumber
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
        name: sessionData.name,
        user_id: sessionData.userId,
        phone_number: sessionData.phoneNumber,
        status_id: sessionData.statusId,
        account_protection: sessionData.accountProtection,
        log_messages: sessionData.logMessages,
        webhook_enabled: sessionData.webhookEnabled
      };

      if (sessionData.webhookUrl) {
        createData.webhook_url = sessionData.webhookUrl;
      }

      if (sessionData.browserContextId) {
        createData.browser_context_id = sessionData.browserContextId;
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
  public async getSessionById(sessionId: number, user_id: number): Promise<ApiResponse<WhatsAppSession>> {
    try {
      const session = await WhatsAppSession.findOne({
        where: { id: sessionId, user_id: user_id },
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
  public async getUserSessions(user_id: number, pagination: PaginationQuery = {}, filters: FilterQuery = {}): Promise<PaginatedResponse<WhatsAppSession>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;
      const sortBy = pagination.sortBy || 'created_at';
      const sortOrder = pagination.sortOrder || 'DESC';

      // Build where clause
      const whereClause: any = { user_id };
      
      if (filters.search) {
        whereClause.phone_number = { [Op.like]: `%${filters.search}%` };
      }

      if (filters.status) {
        whereClause.status_id = await this.getStatusIdBySlug(filters.status);
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
  public async updateSession(sessionId: number, user_id: number, sessionData: UpdateWhatsAppSessionRequest): Promise<ApiResponse<WhatsAppSession>> {
    try {
      this.logger.info('Updating WhatsApp session', { sessionId, user_id: user_id });

      // Validate ownership
      const ownershipValid = await this.validateSessionOwnership(sessionId, user_id);
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
      await session.update({
        ...(sessionData.phoneNumber !== undefined && { phone_number: sessionData.phoneNumber }),
        ...(sessionData.statusId !== undefined && { status_id: sessionData.statusId }),
        ...(sessionData.accountProtection !== undefined && { account_protection: sessionData.accountProtection }),
        ...(sessionData.logMessages !== undefined && { log_messages: sessionData.logMessages }),
        ...(sessionData.webhookUrl !== undefined && { webhook_url: sessionData.webhookUrl }),
        ...(sessionData.webhookEnabled !== undefined && { webhook_enabled: sessionData.webhookEnabled }),
        ...(sessionData.browserContextId !== undefined && { browser_context_id: sessionData.browserContextId })
      });

      const updatedSession = await this.getSessionById(sessionId, user_id);

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
  public async deleteSession(sessionId: number, user_id: number): Promise<ApiResponse<void>> {
    try {
      this.logger.info('Deleting WhatsApp session', { sessionId, user_id: user_id });

      // Validate ownership
      const ownershipValid = await this.validateSessionOwnership(sessionId, user_id);
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
      await Message.destroy({ where: { whatsapp_session_id: sessionId } });

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
  public async getSessionStatus(sessionId: number, user_id: number): Promise<ApiResponse<any>> {
    try {
      const sessionResponse = await this.getSessionById(sessionId, user_id);
      if (!sessionResponse.success || !sessionResponse.data) {
        return {
          success: false,
          message: 'Session not found'
        };
      }

      const session = sessionResponse.data;
      const messageCount = await Message.count({ where: { whatsapp_session_id: sessionId } });

      const status = {
        id: session.id,
        phone_number: session.phone_number,
        status: session.WhatsAppSessionStatus?.slug || 'unknown',
        account_protection: session.account_protection,
        log_messages: session.log_messages,
        webhook_enabled: session.webhook_enabled,
        messageCount,
        created_at: session.created_at,
        updated_at: session.updated_at
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
  public async connectSession(sessionId: number, user_id: number): Promise<ApiResponse<void>> {
    try {
      this.logger.info('Connecting WhatsApp session', { sessionId, user_id: user_id });

      // Validate ownership
      const ownershipValid = await this.validateSessionOwnership(sessionId, user_id);
      if (!ownershipValid) {
        return {
          success: false,
          message: 'Session not found or access denied'
        };
      }

      // Update session status to connecting
      await WhatsAppSession.update(
        { status_id: await this.getStatusIdBySlug('connecting') },
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
  public async disconnectSession(sessionId: number, user_id: number): Promise<ApiResponse<void>> {
    try {
      this.logger.info('Disconnecting WhatsApp session', { sessionId, user_id: user_id });

      // Validate ownership
      const ownershipValid = await this.validateSessionOwnership(sessionId, user_id);
      if (!ownershipValid) {
        return {
          success: false,
          message: 'Session not found or access denied'
        };
      }

      // Update session status to disconnected
      await WhatsAppSession.update(
        { status_id: await this.getStatusIdBySlug('disconnected') },
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
  public async getSessionMessages(sessionId: number, user_id: number, pagination: PaginationQuery = {}): Promise<PaginatedResponse<Message>> {
    try {
      // Validate ownership
      const ownershipValid = await this.validateSessionOwnership(sessionId, user_id);
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
      const sortBy = pagination.sortBy || 'sent_at';
      const sortOrder = pagination.sortOrder || 'DESC';

      const { count, rows } = await Message.findAndCountAll({
        where: { whatsapp_session_id: sessionId },
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
  public async getSessionStats(sessionId: number, user_id: number): Promise<ApiResponse<any>> {
    try {
      // Validate ownership
      const ownershipValid = await this.validateSessionOwnership(sessionId, user_id);
      if (!ownershipValid) {
        return {
          success: false,
          message: 'Session not found or access denied'
        };
      }

      const totalMessages = await Message.count({ where: { whatsapp_session_id: sessionId } });
      const messagesToday = await Message.count({
        where: {
          whatsapp_session_id: sessionId,
          sent_at: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      });

      const stats = {
        sessionId,
        totalMessages,
        messagesToday,
        created_at: (await WhatsAppSession.findByPk(sessionId))?.created_at
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
      const sortBy = pagination.sortBy || 'created_at';
      const sortOrder = pagination.sortOrder || 'DESC';

      // Build where clause
      const whereClause: any = {};
      
      if (filters.search) {
        whereClause.phone_number = { [Op.like]: `%${filters.search}%` };
      }

      if (filters.status) {
        whereClause.status_id = await this.getStatusIdBySlug(filters.status);
      }

      if (filters.userId) {
        whereClause.user_id = filters.userId;
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
        where: { status_id: statusId },
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
        order: [['created_at', 'DESC']]
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
  public async getSessionsByUser(user_id: number, pagination: PaginationQuery = {}): Promise<PaginatedResponse<WhatsAppSession>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await WhatsAppSession.findAndCountAll({
        where: { user_id },
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
        order: [['created_at', 'DESC']]
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
  public async getSessionCountByUser(user_id: number): Promise<ApiResponse<number>> {
    try {
      const count = await WhatsAppSession.count({ where: { user_id: user_id } });

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
  public async validateSessionOwnership(sessionId: number, user_id: number): Promise<boolean> {
    try {
      const session = await WhatsAppSession.findOne({
        where: { id: sessionId, user_id: user_id }
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
  private isValidPhoneNumber(phone_number: string): boolean {
    // Basic phone number validation - can be enhanced
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone_number);
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
