import { Router } from "express";
import { WhatsAppSessionController } from "../controllers/WhatsAppSessionController";
import { AuthMiddleware } from "../middleware/auth";
import { ValidationMiddleware } from "../middleware/validation";
import {
	createWhatsAppSessionSchema,
	updateWhatsAppSessionSchema,
	sessionFilterSchema,
	idParamSchema,
	sessionIdParamSchema,
} from "../schemas/validationSchemas";

const router = Router();
const sessionController = new WhatsAppSessionController();
const validationMiddleware = ValidationMiddleware.getInstance();
const authMiddleware = AuthMiddleware.getInstance();

/**
 * @swagger
 * components:
 *   schemas:
 *     WhatsAppSession:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *         name:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         status:
 *           type: string
 *         accountProtection:
 *           type: boolean
 *         logMessages:
 *           type: boolean
 *         webhookUrl:
 *           type: string
 *         webhookEnabled:
 *           type: boolean
 *         webhook_events:
 *           type: array
 *           items:
 *             type: string
 *         browserContextId:
 *           type: number
 *         userId:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateWhatsAppSessionRequest:
 *       type: object
 *       required:
 *         - name
 *         - phoneNumber
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 200
 *         phoneNumber:
 *           type: string
 *         accountProtection:
 *           type: boolean
 *           default: false
 *         logMessages:
 *           type: boolean
 *           default: true
 *         webhookUrl:
 *           type: string
 *           format: uri
 *         webhookEnabled:
 *           type: boolean
 *           default: false
 *         browserContextId:
 *           type: number
 *     UpdateWhatsAppSessionRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 200
 *         phoneNumber:
 *           type: string
 *         accountProtection:
 *           type: boolean
 *         logMessages:
 *           type: boolean
 *         webhookUrl:
 *           type: string
 *           format: uri
 *         webhookEnabled:
 *           type: boolean
 *         browserContextId:
 *           type: number
 */

/**
 * @swagger
 * /api/whatsapp-sessions:
 *   get:
 *     summary: Get all WhatsApp sessions with pagination and filters
 *     tags: [WhatsApp Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: statusId
 *         schema:
 *           type: number
 *       - in: query
 *         name: userId
 *         schema:
 *           type: number
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: WhatsApp sessions retrieved successfully
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
 *                     $ref: '#/components/schemas/WhatsAppSession'
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
 *       500:
 *         description: Internal server error
 */
router.get(
	"/",
	authMiddleware.authenticate,
	validationMiddleware.validateQuery(sessionFilterSchema),
	sessionController.getSessions
);

/**
 * @swagger
 * /api/whatsapp-sessions:
 *   post:
 *     summary: Create a new WhatsApp session
 *     tags: [WhatsApp Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWhatsAppSessionRequest'
 *     responses:
 *       201:
 *         description: WhatsApp session created successfully
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
 *                   $ref: '#/components/schemas/WhatsAppSession'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
	"/",
	authMiddleware.authenticate,
	validationMiddleware.validateBody(createWhatsAppSessionSchema),
	sessionController.createSession
);

/**
 * @swagger
 * /api/whatsapp-sessions/{id}:
 *   get:
 *     summary: Get WhatsApp session by ID
 *     tags: [WhatsApp Sessions]
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
 *         description: WhatsApp session retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/WhatsAppSession'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: WhatsApp session not found
 *       500:
 *         description: Internal server error
 */
router.get(
	"/:id",
	authMiddleware.authenticate,
	validationMiddleware.validateParams(idParamSchema),
	sessionController.getSessionById
);

/**
 * @swagger
 * /api/whatsapp-sessions/{id}:
 *   put:
 *     summary: Update WhatsApp session by ID
 *     tags: [WhatsApp Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWhatsAppSessionRequest'
 *     responses:
 *       200:
 *         description: WhatsApp session updated successfully
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
 *                   $ref: '#/components/schemas/WhatsAppSession'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: WhatsApp session not found
 *       500:
 *         description: Internal server error
 */
router.put(
	"/:id",
	authMiddleware.authenticate,
	validationMiddleware.validateParams(idParamSchema),
	validationMiddleware.validateBody(updateWhatsAppSessionSchema),
	sessionController.updateSession
);

/**
 * @swagger
 * /api/whatsapp-sessions/{id}:
 *   delete:
 *     summary: Delete WhatsApp session by ID
 *     tags: [WhatsApp Sessions]
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
 *         description: WhatsApp session deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: WhatsApp session not found
 *       500:
 *         description: Internal server error
 */
router.delete(
	"/:id",
	authMiddleware.authenticate,
	validationMiddleware.validateParams(idParamSchema),
	sessionController.deleteSession
);

/**
 * @swagger
 * /api/whatsapp-sessions/{id}/connect:
 *   post:
 *     summary: Connect WhatsApp session
 *     tags: [WhatsApp Sessions]
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
 *         description: WhatsApp session connected successfully
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
 *                     qrCode:
 *                       type: string
 *                     status:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: WhatsApp session not found
 *       500:
 *         description: Internal server error
 */
router.post(
	"/:id/connect",
	authMiddleware.authenticate,
	validationMiddleware.validateParams(idParamSchema),
	sessionController.connectSession
);

/**
 * @swagger
 * /api/whatsapp-sessions/{id}/disconnect:
 *   post:
 *     summary: Disconnect WhatsApp session
 *     tags: [WhatsApp Sessions]
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
 *         description: WhatsApp session disconnected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: WhatsApp session not found
 *       500:
 *         description: Internal server error
 */
router.post(
	"/:id/disconnect",
	authMiddleware.authenticate,
	validationMiddleware.validateParams(idParamSchema),
	sessionController.disconnectSession
);

/**
 * @swagger
 * /api/whatsapp-sessions/{id}/select:
 *   post:
 *     summary: Select WhatsApp session for use
 *     tags: [WhatsApp Sessions]
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
 *         description: WhatsApp session selected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: WhatsApp session not found
 *       500:
 *         description: Internal server error
 */
router.post(
	"/:id/select",
	authMiddleware.authenticate,
	validationMiddleware.validateParams(idParamSchema),
	sessionController.selectSession
);

/**
 * @swagger
 * /api/whatsapp-sessions/{id}/qr:
 *   get:
 *     summary: Get WhatsApp session QR code
 *     tags: [WhatsApp Sessions]
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
 *         description: QR code retrieved successfully
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
 *                     qrCode:
 *                       type: string
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: WhatsApp session not found
 *       500:
 *         description: Internal server error
 */
router.get(
	"/:id/qr",
	authMiddleware.authenticate,
	validationMiddleware.validateParams(idParamSchema),
	sessionController.getSessionQR
);

/**
 * @swagger
 * /api/whatsapp-sessions/{id}/qr/refresh:
 *   post:
 *     summary: Refresh WhatsApp session QR code
 *     tags: [WhatsApp Sessions]
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
 *         description: QR code refreshed successfully
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
 *                     qrCode:
 *                       type: string
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: WhatsApp session not found
 *       500:
 *         description: Internal server error
 */
router.post(
	"/:id/qr/refresh",
	authMiddleware.authenticate,
	validationMiddleware.validateParams(idParamSchema),
	sessionController.refreshQR
);

/**
 * @swagger
 * /api/whatsapp-sessions/{id}/status:
 *   get:
 *     summary: Get WhatsApp session status
 *     tags: [WhatsApp Sessions]
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
 *         description: Session status retrieved successfully
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
 *                     status:
 *                       type: string
 *                     lastSeen:
 *                       type: string
 *                       format: date-time
 *                     batteryLevel:
 *                       type: number
 *                     isOnline:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: WhatsApp session not found
 *       500:
 *         description: Internal server error
 */
router.get(
	"/:id/status",
	authMiddleware.authenticate,
	validationMiddleware.validateParams(idParamSchema),
	sessionController.getSessionStatus
);

/**
 * @swagger
 * /api/whatsapp-sessions/stats:
 *   get:
 *     summary: Get WhatsApp sessions statistics
 *     tags: [WhatsApp Sessions]
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
 *                     totalSessions:
 *                       type: number
 *                     connectedSessions:
 *                       type: number
 *                     disconnectedSessions:
 *                       type: number
 *                     sessionsByStatus:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
	"/stats",
	authMiddleware.authenticate,
	sessionController.getSessionStats
);

export default router;
