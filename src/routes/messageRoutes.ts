import { Router } from 'express';
import { MessageController } from '../controllers/MessageController';
import { AuthMiddleware } from '../middleware/auth';
import { ValidationMiddleware } from '../middleware/validation';
import { 
  createMessageSchema, 
  bulkMessageSchema
} from '../schemas/validationSchemas';

const router = Router();
const messageController = new MessageController();
const validationMiddleware = ValidationMiddleware.getInstance();
const authMiddleware = AuthMiddleware.getInstance();

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *         sessionId:
 *           type: number
 *         phoneNumber:
 *           type: string
 *         message:
 *           type: string
 *         messageType:
 *           type: string
 *           enum: [text, image, video, audio, document]
 *         mediaUrl:
 *           type: string
 *         status:
 *           type: string
 *         sentAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateMessageRequest:
 *       type: object
 *       required:
 *         - sessionId
 *         - phoneNumber
 *         - message
 *       properties:
 *         sessionId:
 *           type: number
 *         phoneNumber:
 *           type: string
 *         message:
 *           type: string
 *           minLength: 1
 *           maxLength: 4096
 *         messageType:
 *           type: string
 *           enum: [text, image, video, audio, document]
 *           default: text
 *         mediaUrl:
 *           type: string
 *           format: uri
 *         sentAt:
 *           type: string
 *           format: date-time
 *     BulkMessageRequest:
 *       type: object
 *       required:
 *         - sessionId
 *         - contacts
 *       properties:
 *         sessionId:
 *           type: number
 *         contacts:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - name
 *               - message
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *               message:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 4096
 *           minItems: 1
 *           maxItems: 1000
 *         delay:
 *           type: number
 *           minimum: 1000
 *           maximum: 60000
 *           default: 2000
 */

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send a single message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMessageRequest'
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.post('/',
  authMiddleware.authenticate,
  validationMiddleware.validateBody(createMessageSchema),
  messageController.createMessage
);

/**
 * @swagger
 * /api/messages/bulk:
 *   post:
 *     summary: Send bulk messages
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkMessageRequest'
 *     responses:
 *       201:
 *         description: Bulk messages sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProcessed:
 *                       type: number
 *                     successful:
 *                       type: number
 *                     failed:
 *                       type: number
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           phoneNumber:
 *                             type: string
 *                           status:
 *                             type: string
 *                           messageId:
 *                             type: string
 *                           error:
 *                             type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.post('/bulk',
  authMiddleware.authenticate,
  validationMiddleware.validateBody(bulkMessageSchema),
  messageController.sendBulkMessages
);

/**
 * @swagger
 * /api/messages/{id}:
 *   get:
 *     summary: Get message by ID
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Message retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Message not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id',
  authMiddleware.authenticate,
  messageController.getMessageById
);

/**
 * @swagger
 * /api/messages/session/{sessionId}:
 *   get:
 *     summary: Get messages by session ID
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     total:
 *                       type: number
 *                     totalPages:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.get('/session/:sessionId',
  authMiddleware.authenticate,
  messageController.getMessagesBySession
);

/**
 * @swagger
 * /api/messages/stats:
 *   get:
 *     summary: Get message statistics
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalMessages:
 *                       type: number
 *                     sentMessages:
 *                       type: number
 *                     failedMessages:
 *                       type: number
 *                     messagesByType:
 *                       type: object
 *                     messagesBySession:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/stats',
  authMiddleware.authenticate,
  messageController.getMessageStats
);

export default router;
