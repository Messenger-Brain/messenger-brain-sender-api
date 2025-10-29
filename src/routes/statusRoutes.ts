import { Router } from 'express';
import WhatsAppSessionController from '../controllers/WhatsAppSessionController';

const router = Router();
const sessionController = new WhatsAppSessionController();

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: Get WhatsApp Session Status
 *     description: Get the current status of a WhatsApp session using the session's API key for authentication. Provide the api_key from whatsapp_sessions table in the Authorization header as "Bearer {api_key}"
 *     tags: [Status]
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token with your WhatsApp session API key (from api_key column in whatsapp_sessions table)
 *         example: Bearer api-key-1-9169dfafc75b7971
 *     responses:
 *       200:
 *         description: Session status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [connecting, connected, disconnected, need_scan, logged_out, expired]
 *                   description: Current status of the WhatsApp session
 *             examples:
 *               connected:
 *                 summary: Session is connected
 *                 value:
 *                   status: "connected"
 *               disconnected:
 *                 summary: Session is disconnected
 *                 value:
 *                   status: "disconnected"
 *               need_scan:
 *                 summary: Session needs QR code scan
 *                 value:
 *                   status: "need_scan"
 *               logged_out:
 *                 summary: Session is logged out
 *                 value:
 *                   status: "logged_out"
 *               expired:
 *                 summary: Session has expired
 *                 value:
 *                   status: "expired"
 *               connecting:
 *                 summary: Session is connecting
 *                 value:
 *                   status: "connecting"
 */
router.get('/', sessionController.getStatusByApiKey);

export default router;
