import Message from '../models/Message';
import MessageStatus from '../models/MessageStatus';
import WhatsAppSession from '../models/WhatsAppSession';
import User from '../models/User';
import { ConfigService } from '../config/ConfigService';
import Logger from '../utils/logger';
import { Op } from 'sequelize';
import { 
  CreateMessageRequest,
  UpdateMessageRequest,
  PaginationQuery,
  FilterQuery,
  ApiResponse,
  PaginatedResponse 
} from '../types';

export interface MessageServiceInterface {
  createMessage(messageData: CreateMessageRequest): Promise<ApiResponse<Message>>;
  getMessageById(messageId: number, user_id: number): Promise<ApiResponse<Message>>;
  getAllMessages(pagination?: PaginationQuery, filters?: FilterQuery): Promise<PaginatedResponse<Message>>;
  updateMessage(messageId: number, user_id: number, messageData: UpdateMessageRequest): Promise<ApiResponse<Message>>;
  deleteMessage(messageId: number, user_id: number): Promise<ApiResponse<void>>;
  getMessagesBySession(sessionId: number, user_id: number, pagination?: PaginationQuery): Promise<PaginatedResponse<Message>>;
  getMessagesByStatus(statusSlug: string, pagination?: PaginationQuery): Promise<PaginatedResponse<Message>>;
  getMessagesByUser(user_id: number, pagination?: PaginationQuery): Promise<PaginatedResponse<Message>>;
  getMessageStats(user_id: number): Promise<ApiResponse<any>>;
  getMessageStatsBySession(sessionId: number, user_id: number): Promise<ApiResponse<any>>;
  searchMessages(searchTerm: string, user_id: number, pagination?: PaginationQuery): Promise<PaginatedResponse<Message>>;
  getMessagesByDateRange(user_id: number, dateFrom: string, dateTo: string, pagination?: PaginationQuery): Promise<PaginatedResponse<Message>>;
  validateMessageOwnership(messageId: number, user_id: number): Promise<boolean>;
}

export class MessageService implements MessageServiceInterface {
  private static instance: MessageService;
  private configService: ConfigService;
  private logger: typeof Logger;

  constructor() {
    this.configService = ConfigService.getInstance();
    this.logger = Logger;
  }

  public static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }

  /**
   * Create a new message
   */
  public async createMessage(messageData: CreateMessageRequest): Promise<ApiResponse<Message>> {
    try {
      this.logger.info('Creating message', { remoteJid: messageData.remoteJid, sessionId: messageData.whatsappSessionId });

      // Validate session ownership
      const session = await WhatsAppSession.findOne({
        where: { id: messageData.whatsappSessionId }
      });

      if (!session) {
        return {
          success: false,
          message: 'WhatsApp session not found'
        };
      }

      // Create message
      const message = await Message.create({
        remote_jid: messageData.remoteJid,
        whatsapp_session_id: messageData.whatsappSessionId,
        message_session_status_id: messageData.statusId,
        sent_at: messageData.sentAt || new Date(),
        key: messageData.key,
        message: messageData.message,
        result: messageData.result
      });

      // Get message with relations
      const messageWithRelations = await this.getMessageById(message.id, session.user_id);

      this.logger.info('Message created successfully', { messageId: message.id });

      return {
        success: true,
        message: 'Message created successfully',
        data: messageWithRelations.data!
      };

    } catch (error) {
      this.logger.error('Failed to create message', error);
      return {
        success: false,
        message: 'Failed to create message',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get message by ID
   */
  public async getMessageById(messageId: number, user_id: number): Promise<ApiResponse<Message>> {
    try {
      const message = await Message.findOne({
        where: { id: messageId },
        include: [
          {
            model: WhatsAppSession,
            where: { user_id: user_id },
            include: [{ model: User }]
          },
          {
            model: MessageStatus
          }
        ]
      });

      if (!message) {
        return {
          success: false,
          message: 'Message not found or access denied'
        };
      }

      return {
        success: true,
        message: 'Message retrieved successfully',
        data: message
      };

    } catch (error) {
      this.logger.error('Failed to get message by ID', error);
      return {
        success: false,
        message: 'Failed to retrieve message',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all messages with pagination and filters
   */
  public async getAllMessages(pagination: PaginationQuery = {}, filters: FilterQuery = {}): Promise<PaginatedResponse<Message>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;
      const sortBy = pagination.sortBy || 'sent_at';
      const sortOrder = pagination.sortOrder || 'DESC';

      // Build where clause
      const whereClause: any = {};
      
      if (filters.search) {
        whereClause.remoteJid = { [Op.like]: `%${filters.search}%` };
      }

      if (filters.status) {
        whereClause.status_id = await this.getStatusIdBySlug(filters.status);
      }

      if (filters.userId) {
        whereClause['$WhatsAppSession.user_id$'] = filters.userId;
      }

      if (filters.dateFrom && filters.dateTo) {
        whereClause.sent_at = {
          [Op.between]: [new Date(filters.dateFrom), new Date(filters.dateTo)]
        };
      }

      // Get messages with pagination
      const { count, rows } = await Message.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: WhatsAppSession,
            include: [{ model: User }]
          },
          {
            model: MessageStatus
          }
        ],
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
      this.logger.error('Failed to get all messages', error);
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
   * Update message
   */
  public async updateMessage(messageId: number, user_id: number, messageData: UpdateMessageRequest): Promise<ApiResponse<Message>> {
    try {
      this.logger.info('Updating message', { messageId, user_id: user_id });

      // Validate ownership
      const ownershipValid = await this.validateMessageOwnership(messageId, user_id);
      if (!ownershipValid) {
        return {
          success: false,
          message: 'Message not found or access denied'
        };
      }

      const message = await Message.findByPk(messageId);
      if (!message) {
        return {
          success: false,
          message: 'Message not found'
        };
      }

      // Update message
      await message.update(messageData);

      const updatedMessage = await this.getMessageById(messageId, user_id);

      this.logger.info('Message updated successfully', { messageId });

      return {
        success: true,
        message: 'Message updated successfully',
        data: updatedMessage.data!
      };

    } catch (error) {
      this.logger.error('Failed to update message', error);
      return {
        success: false,
        message: 'Failed to update message',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete message
   */
  public async deleteMessage(messageId: number, user_id: number): Promise<ApiResponse<void>> {
    try {
      this.logger.info('Deleting message', { messageId, user_id: user_id });

      // Validate ownership
      const ownershipValid = await this.validateMessageOwnership(messageId, user_id);
      if (!ownershipValid) {
        return {
          success: false,
          message: 'Message not found or access denied'
        };
      }

      const message = await Message.findByPk(messageId);
      if (!message) {
        return {
          success: false,
          message: 'Message not found'
        };
      }

      // Delete message
      await message.destroy();

      this.logger.info('Message deleted successfully', { messageId });

      return {
        success: true,
        message: 'Message deleted successfully'
      };

    } catch (error) {
      this.logger.error('Failed to delete message', error);
      return {
        success: false,
        message: 'Failed to delete message',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get messages by session
   */
  public async getMessagesBySession(sessionId: number, user_id: number, pagination: PaginationQuery = {}): Promise<PaginatedResponse<Message>> {
    try {
      // Validate session ownership
      const session = await WhatsAppSession.findOne({
        where: { id: sessionId, user_id: user_id }
      });

      if (!session) {
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
        include: [
          {
            model: WhatsAppSession,
            include: [{ model: User }]
          },
          {
            model: MessageStatus
          }
        ],
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
      this.logger.error('Failed to get messages by session', error);
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
   * Get messages by status
   */
  public async getMessagesByStatus(statusSlug: string, pagination: PaginationQuery = {}): Promise<PaginatedResponse<Message>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;

      const statusId = await this.getStatusIdBySlug(statusSlug);

      const { count, rows } = await Message.findAndCountAll({
        where: { message_session_status_id: statusId },
        include: [
          {
            model: WhatsAppSession,
            include: [{ model: User }]
          },
          {
            model: MessageStatus
          }
        ],
        limit,
        offset,
        order: [['sent_at', 'DESC']]
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
      this.logger.error('Failed to get messages by status', error);
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
   * Get messages by user
   */
  public async getMessagesByUser(user_id: number, pagination: PaginationQuery = {}): Promise<PaginatedResponse<Message>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await Message.findAndCountAll({
        include: [
          {
            model: WhatsAppSession,
            where: { user_id: user_id },
            include: [{ model: User }]
          },
          {
            model: MessageStatus
          }
        ],
        limit,
        offset,
        order: [['sent_at', 'DESC']]
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
      this.logger.error('Failed to get messages by user', error);
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
   * Get message statistics for user
   */
  public async getMessageStats(user_id: number): Promise<ApiResponse<any>> {
    try {
      const totalMessages = await Message.count({
        include: [
          {
            model: WhatsAppSession,
            where: { user_id: user_id }
          }
        ]
      });

      const messagesToday = await Message.count({
        include: [
          {
            model: WhatsAppSession,
            where: { user_id: user_id }
          }
        ],
        where: {
          sent_at: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      });

      const messagesThisWeek = await Message.count({
        include: [
          {
            model: WhatsAppSession,
            where: { user_id: user_id }
          }
        ],
        where: {
          sent_at: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      });

      const stats = { user_id: user_id,
        totalMessages,
        messagesToday,
        messagesThisWeek
      };

      return {
        success: true,
        message: 'Message statistics retrieved successfully',
        data: stats
      };

    } catch (error) {
      this.logger.error('Failed to get message stats', error);
      return {
        success: false,
        message: 'Failed to retrieve message statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get message statistics by session
   */
  public async getMessageStatsBySession(sessionId: number, user_id: number): Promise<ApiResponse<any>> {
    try {
      // Validate session ownership
      const session = await WhatsAppSession.findOne({
        where: { id: sessionId, user_id: user_id }
      });

      if (!session) {
        return {
          success: false,
          message: 'Session not found or access denied'
        };
      }

      const totalMessages = await Message.count({
        where: { whatsapp_session_id: sessionId }
      });

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
        created_at: session.created_at
      };

      return {
        success: true,
        message: 'Session message statistics retrieved successfully',
        data: stats
      };

    } catch (error) {
      this.logger.error('Failed to get session message stats', error);
      return {
        success: false,
        message: 'Failed to retrieve session message statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search messages
   */
  public async searchMessages(searchTerm: string, user_id: number, pagination: PaginationQuery = {}): Promise<PaginatedResponse<Message>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await Message.findAndCountAll({
        where: {
          remote_jid: { [Op.like]: `%${searchTerm}%` }
        },
        include: [
          {
            model: WhatsAppSession,
            where: { user_id: user_id },
            include: [{ model: User }]
          },
          {
            model: MessageStatus
          }
        ],
        limit,
        offset,
        order: [['sent_at', 'DESC']]
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
      this.logger.error('Failed to search messages', error);
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
   * Get messages by date range
   */
  public async getMessagesByDateRange(user_id: number, dateFrom: string, dateTo: string, pagination: PaginationQuery = {}): Promise<PaginatedResponse<Message>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;
      const offset = (page - 1) * limit;

      const { count, rows } = await Message.findAndCountAll({
        where: {
          sent_at: {
            [Op.between]: [new Date(dateFrom), new Date(dateTo)]
          }
        },
        include: [
          {
            model: WhatsAppSession,
            where: { user_id: user_id },
            include: [{ model: User }]
          },
          {
            model: MessageStatus
          }
        ],
        limit,
        offset,
        order: [['sent_at', 'DESC']]
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
      this.logger.error('Failed to get messages by date range', error);
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
   * Send bulk messages
   */
  public async sendBulkMessages(bulkData: any): Promise<ApiResponse<any>> {
    try {
      const { sessionId, contacts, delay = 2000 } = bulkData;
      
      // Validate session exists and belongs to user
      const session = await WhatsAppSession.findOne({
        where: { id: sessionId }
      });

      if (!session) {
        return {
          success: false,
          message: 'WhatsApp session not found'
        };
      }

      const results = [];
      let successful = 0;
      let failed = 0;

      for (const contact of contacts) {
        try {
          const messageData = {
            remoteJid: contact.phone_number,
            whatsappSessionId: sessionId,
            statusId: await this.getStatusIdBySlug('pending'),
            sentAt: new Date(),
            key: { id: `bulk_${Date.now()}_${Math.random()}` },
            message: { conversation: contact.message }
          };

          const result = await this.createMessage(messageData);
          
          if (result.success) {
            successful++;
            results.push({
              phone_number: contact.phone_number,
              status: 'success',
              messageId: result.data?.id
            });
          } else {
            failed++;
            results.push({
              phone_number: contact.phone_number,
              status: 'failed',
              error: result.message
            });
          }

          // Add delay between messages
          if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        } catch (error) {
          failed++;
          results.push({
            phone_number: contact.phone_number,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return {
        success: true,
        message: 'Bulk messages processed',
        data: {
          totalProcessed: contacts.length,
          successful,
          failed,
          results
        }
      };
    } catch (error) {
      this.logger.error('Failed to send bulk messages', error);
      return {
        success: false,
        message: 'Failed to send bulk messages',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate message ownership
   */
  public async validateMessageOwnership(messageId: number, user_id: number): Promise<boolean> {
    try {
      const message = await Message.findOne({
        where: { id: messageId },
        include: [
          {
            model: WhatsAppSession,
            where: { user_id: user_id }
          }
        ]
      });

      return !!message;
    } catch (error) {
      this.logger.error('Failed to validate message ownership', error);
      return false;
    }
  }

  /**
   * Helper method to get status ID by slug
   */
  private async getStatusIdBySlug(slug: string): Promise<number> {
    const status = await MessageStatus.findOne({ where: { slug } });
    return status?.id || 1; // Default to first status
  }
}

export default MessageService;
