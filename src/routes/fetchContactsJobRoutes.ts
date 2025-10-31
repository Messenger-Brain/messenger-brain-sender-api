import { Router } from 'express';
import { FetchContactsJobController } from '../controllers/FetchContactsJobController';
import { AuthMiddleware } from '../middleware/auth';
import { ValidationMiddleware } from '../middleware/validation';
import { 
  createFetchContactsJobSchema,
  paginationSchema,
  idParamSchema
} from '../schemas/validationSchemas';

const router = Router();
const jobController = new FetchContactsJobController();
const validationMiddleware = ValidationMiddleware.getInstance();
const authMiddleware = AuthMiddleware.getInstance();

/**
 * @swagger
 * components:
 *   schemas:
 *     FetchContactsJob:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *         userId:
 *           type: number
 *           description: ID del usuario que creó el job
 *         browserContextId:
 *           type: number
 *           description: ID del Browser Context usado por Puppeteer
 *         whatsappSessionId:
 *           type: number
 *           description: ID de la sesión de WhatsApp asociada
 *         statusId:
 *           type: number
 *           description: ID del estado actual (pending, running, paused, completed, failed, cancelled)
 *         log:
 *           type: object
 *           description: JSON con detalles del proceso (contactos, métricas, errores)
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateFetchContactsJobRequest:
 *       type: object
 *       required:
 *         - whatsapp_session_id
 *       properties:
 *         whatsapp_session_id:
 *           type: number
 *           description: ID de la sesión de WhatsApp asociada
 *           example: 1
 *         delay:
 *           type: integer
 *           minimum: 1000
 *           maximum: 60000
 *           default: 2000
 *           example: 3000
 *         priority:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 5
 *           example: 7
 */

/**
 * @swagger
 * /api/fetch-contacts-jobs:
 *   get:
 *     summary: Get all fetch-contacts jobs with pagination
 *     tags: [Fetch Contacts Jobs]
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
 *         name: statusId
 *         schema:
 *           type: number
 *       - in: query
 *         name: userId
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Jobs retrieved successfully
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
 *                     $ref: '#/components/schemas/FetchContactsJob'
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
  '/',
  authMiddleware.authenticate,
  validationMiddleware.validateQuery(paginationSchema),
  jobController.getJobs
);

/**
 * @swagger
 * /api/fetch-contacts-jobs:
 *   post:
 *     summary: Create a new fetch-contacts job
 *     tags: [Fetch Contacts Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFetchContactsJobRequest'
 *     responses:
 *       201:
 *         description: Job created successfully
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
 *                   $ref: '#/components/schemas/FetchContactsJob'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  authMiddleware.authenticate,
  validationMiddleware.validateBody(createFetchContactsJobSchema),
  jobController.createJob
);


/**
 * @swagger
 * /api/fetch-contacts-jobs/stats:
 *   get:
 *     summary: Get fetch-contacts jobs statistics
 *     tags: [Fetch Contacts Jobs]
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
 *                     totalJobs:
 *                       type: number
 *                     pendingJobs:
 *                       type: number
 *                     runningJobs:
 *                       type: number
 *                     completedJobs:
 *                       type: number
 *                     failedJobs:
 *                       type: number
 *                     cancelledJobs:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/stats',
  authMiddleware.authenticate,
  jobController.getJobStats
);

/**
 * @swagger
 * /api/fetch-contacts-jobs/{id}:
 *   get:
 *     summary: Get fetch-contacts job by ID
 *     tags: [Fetch Contacts Jobs]
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
 *         description: Job retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/FetchContactsJob'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id',
  authMiddleware.authenticate,
  validationMiddleware.validateParams(idParamSchema),
  jobController.getJobById
);

/**
 * @swagger
 * /api/fetch-contacts-jobs/{id}/start:
 *   post:
 *     summary: Start a fetch-contacts job
 *     tags: [Fetch Contacts Jobs]
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
 *         description: Job started successfully
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
 *         description: Job not found
 *       400:
 *         description: Job cannot be started
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:id/start',
  authMiddleware.authenticate,
  validationMiddleware.validateParams(idParamSchema),
  jobController.startJob
);

/**
 * @swagger
 * /api/fetch-contacts-jobs/{id}/pause:
 *   post:
 *     summary: Pause a fetch-contacts job
 *     tags: [Fetch Contacts Jobs]
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
 *         description: Job paused successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 *       400:
 *         description: Job cannot be paused
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:id/pause',
  authMiddleware.authenticate,
  validationMiddleware.validateParams(idParamSchema),
  jobController.pauseJob
);

/**
 * @swagger
 * /api/fetch-contacts-jobs/{id}/resume:
 *   post:
 *     summary: Resume a paused fetch-contacts job
 *     tags: [Fetch Contacts Jobs]
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
 *         description: Job resumed successfully
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
 *         description: Job not found
 *       400:
 *         description: Job cannot be resumed
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:id/resume',
  authMiddleware.authenticate,
  validationMiddleware.validateParams(idParamSchema),
  jobController.resumeJob
);

/**
 * @swagger
 * /api/fetch-contacts-jobs/{id}/cancel:
 *   post:
 *     summary: Cancel a fetch-contacts job
 *     tags: [Fetch Contacts Jobs]
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
 *         description: Job cancelled successfully
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
 *         description: Job not found
 *       400:
 *         description: Job cannot be cancelled
 *       500:
 *         description: Internal server error
 */
router.post(
  '/:id/cancel',
  authMiddleware.authenticate,
  validationMiddleware.validateParams(idParamSchema),
  jobController.cancelJob
);

/**
 * @swagger
 * /api/fetch-contacts-jobs/{id}:
 *   delete:
 *     summary: Delete a fetch-contacts job
 *     tags: [Fetch Contacts Jobs]
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
 *         description: Job deleted successfully
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
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/:id',
  authMiddleware.authenticate,
  validationMiddleware.validateParams(idParamSchema),
  jobController.deleteJob
);


export default router;
