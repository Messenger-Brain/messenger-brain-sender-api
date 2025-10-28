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
 *         # phone number aceptado en camelCase y snake_case
 *         phoneNumber:
 *           type: string
 *         phone_number:
 *           type: string
 *         status:
 *           type: string
 *         accountProtection:
 *           type: boolean
 *         account_protection:
 *           type: boolean
 *         logMessages:
 *           type: boolean
 *         log_messages:
 *           type: boolean
 *         readIncomingMessages:
 *           type: boolean
 *         read_incoming_messages:
 *           type: boolean
 *         webhookUrl:
 *           type: string
 *         webhook_url:
 *           type: string
 *         webhookEnabled:
 *           type: boolean
 *         webhook_enabled:
 *           type: boolean
 *         webhookEvents:
 *           type: array
 *           items:
 *             type: string
 *         webhook_events:
 *           type: array
 *           items:
 *             type: string
 *         browserContextId:
 *           type: number
 *         browser_context_id:
 *           type: number
 *         userId:
 *           type: number
 *         user_id:
 *           type: number
 *         apiKey:
 *           type: string
 *         api_key:
 *           type: string
 *         webhookSecret:
 *           type: string
 *         webhook_secret:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         created_at:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *
 *     CreateWhatsAppSessionRequest:
 *       type: object
 *       description: |
 *         Datos para crear una sesión de WhatsApp. La API acepta tanto snake_case como camelCase.
 *       required:
 *         - name
 *         - phone_number
 *         - account_protection
 *         - log_messages
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 200
 *         # Phone number (E.164) - se aceptan ambas claves
 *         phone_number:
 *           type: string
 *           description: Phone number in international format (E.164).
 *           example: "+1234567890"
 *         phoneNumber:
 *           type: string
 *           description: Alias camelCase for phone_number.
 *         account_protection:
 *           type: boolean
 *           description: Enable account protection features.
 *           example: true
 *         accountProtection:
 *           type: boolean
 *           description: Alias camelCase for account_protection.
 *         log_messages:
 *           type: boolean
 *           description: Enable message logging.
 *           example: true
 *         logMessages:
 *           type: boolean
 *           description: Alias camelCase for log_messages.
 *         webhook_url:
 *           type: string
 *           format: uri
 *           description: URL for receiving webhook notifications.
 *           example: "https://example.com/webhook"
 *         webhookUrl:
 *           type: string
 *           format: uri
 *           description: Alias camelCase for webhook_url.
 *         webhook_enabled:
 *           type: boolean
 *           description: Enable webhook notifications.
 *           example: true
 *         webhookEnabled:
 *           type: boolean
 *         webhook_events:
 *           type: array
 *           description: Array of events to receive webhook notifications for.
 *           items:
 *             type: string
 *           example:
 *             - "messages.received"
 *             - "session.status"
 *         webhookEvents:
 *           type: array
 *           items:
 *             type: string
 *         read_incoming_messages:
 *           type: boolean
 *           description: Automatically mark messages as read when they are received.
 *           example: false
 *         readIncomingMessages:
 *           type: boolean
 *         auto_reject_calls:
 *           type: boolean
 *           description: Enable automatic rejection of incoming calls.
 *           example: false
 *         autoRejectCalls:
 *           type: boolean
 *         browser_context_id:
 *           type: integer
 *           description: Optional browser context id to associate the session with.
 *           example: 3
 *         browserContextId:
 *           type: integer
 *
 *     UpdateWhatsAppSessionRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 200
 *         phoneNumber:
 *           type: string
 *         phone_number:
 *           type: string
 *         accountProtection:
 *           type: boolean
 *         account_protection:
 *           type: boolean
 *         logMessages:
 *           type: boolean
 *         log_messages:
 *           type: boolean
 *         webhookUrl:
 *           type: string
 *           format: uri
 *         webhook_url:
 *           type: string
 *           format: uri
 *         webhookEnabled:
 *           type: boolean
 *         webhook_enabled:
 *           type: boolean
 *         browserContextId:
 *           type: number
 *         browser_context_id:
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
 *     summary: Create WhatsApp Session
 *     tags: [WhatsApp Sessions]
 *     description: |
 *       Crea una nueva sesión de WhatsApp para el usuario autenticado. Genera un `api_key` guardado en la BD y devuelve `webhook_secret` una sola vez en la respuesta.
 *       La API acepta tanto snake_case como camelCase en el body.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWhatsAppSessionRequest'
 *           examples:
 *             create:
 *               summary: Ejemplo de petición
 *               value:
 *                 name: "Business WhatsApp"
 *                 phone_number: "+1234567890"
 *                 account_protection: true
 *                 log_messages: true
 *                 webhook_url: "https://example.com/webhook"
 *                 webhook_enabled: true
 *                 webhook_events:
 *                   - "messages.received"
 *                   - "session.status"
 *                   - "messages.update"
 *                 read_incoming_messages: false
 *                 auto_reject_calls: false
 *     responses:
 *       '201':
 *         description: WhatsApp session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/WhatsAppSession'
 *             examples:
 *               success:
 *                 summary: Respuesta exitosa
 *                 value:
 *                   success: true
 *                   data:
 *                     id: 1
 *                     name: "Business WhatsApp"
 *                     phone_number: "+1234567890"
 *                     status: "connected"
 *                     account_protection: true
 *                     log_messages: true
 *                     read_incoming_messages: false
 *                     webhook_url: "https://example.com/webhook"
 *                     webhook_enabled: true
 *                     webhook_events:
 *                       - "messages.received"
 *                       - "session.status"
 *                       - "messages.update"
 *                     api_key: "75075a7bf6417bff59e76fb7205382c2dc74cf1769e76f382c2dc74cf176c0bf"
 *                     webhook_secret: "fb61be92ddb7935e0cedcec58e470f6c"
 *                     created_at: "2025-04-01T12:00:00Z"
 *                     updated_at: "2025-05-08T15:30:00Z"
 *       '400':
 *         description: Validation error or business rule violation (e.g., session limit reached)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *             examples:
 *               limit_reached:
 *                 summary: Límite de sesiones alcanzado
 *                 value:
 *                   success: false
 *                   error: "You have reached your WhatsApp session limit. Please upgrade your plan to add more sessions."
 *               invalid_phone:
 *                 summary: Formato de teléfono inválido
 *                 value:
 *                   success: false
 *                   error: "Invalid phone number format"
 *       '401':
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *             examples:
 *               unauthorized:
 *                 value:
 *                   success: false
 *                   error: "Authentication required"
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *             examples:
 *               internal:
 *                 value:
 *                   success: false
 *                   error: "Session creation failed"
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
