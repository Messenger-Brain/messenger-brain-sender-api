import { Router } from "express";
import { AuthMiddleware } from "../middleware/auth";
import { ValidationMiddleware } from "../middleware/validation";
import { ContactsController } from "../controllers/ContactsController";

const router = Router();
const contactsController = new ContactsController();
const validationMiddleware = ValidationMiddleware.getInstance();
const authMiddleware = AuthMiddleware.getInstance();

/**
 * @swagger
 * components:
 *   schemas:
 *     ContactInformation:
 *       type: object
 *       properties:
 *         jid:
 *           type: string
 *           example: "+50688885555"
 *         name:
 *           type: string
 *           example: "John Doe"
 *         notify:
 *           type: string
 *           example: "John Doe"
 *         verifiedName:
 *           type: string
 *           example: "John Doe"
 *         imgUrl:
 *           type: string
 *           example: ""
 *         status:
 *           type: string
 *           example: "Disponible"
 *
 *     FetchContactByPhoneResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Contacto encontrado correctamente"
 *         contactInformation:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ContactInformation'
 *         fetched_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/contacts/{phoneNumber}:
 *   get:
 *     summary: Get contact information by phone number
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: phoneNumber
 *         required: true
 *         schema:
 *           type: string
 *           example: "88885555"
 *     responses:
 *       200:
 *         description: Contacto obtenido exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FetchContactByPhoneResponse'
 *       400:
 *         description: Error de validación en parámetros.
 *       401:
 *         description: No autorizado.
 *       404:
 *         description: Contacto no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */

router.get(
  "/:phoneNumber",
  authMiddleware.authenticate,
  validationMiddleware.validatePhoneNumber("phoneNumber"),
  contactsController.getContactByPhoneNumber
);

export default router;
