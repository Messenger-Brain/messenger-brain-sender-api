import { Router } from 'express';
import { SendMessageJobController } from '../controllers/SendMessageJobController';
import { AuthMiddleware } from '../middleware/auth';
import { ValidationMiddleware } from '../middleware/validation';
import { 
  createSendMessageJobSchema,
  paginationSchema,
  idParamSchema
} from '../schemas/validationSchemas';

const router = Router();
const jobController = new SendMessageJobController();
const validationMiddleware = ValidationMiddleware.getInstance();
const authMiddleware = AuthMiddleware.getInstance();

/**
 * @swagger
 * components:
 *   schemas:
 *     SendMessageJob:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *         userId:
 *           type: number
 *         sessionId:
 *           type: number
 *         statusId:
 *           type: number
 *         totalMessages:
 *           type: number
 *         processedMessages:
 *           type: number
 *         successfulMessages:
 *           type: number
 *         failedMessages:
 *           type: number
 *         priority:
 *           type: number
 *         delay:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         startedAt:
 *           type: string
 *           format: date-time
 *         completedAt:
 *           type: string
 *           format: date-time
 *     CreateSendMessageJobRequest:
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
 *         priority:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *           default: 5
 */

/**
 * @swagger
 * /api/send-message-jobs:
 *   get:
 *     summary: Get all send message jobs with pagination
 *     tags: [Send Message Jobs]
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
 *                     $ref: '#/components/schemas/SendMessageJob'
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
router.get('/',
  authMiddleware.authenticate,
  validationMiddleware.validateQuery(paginationSchema),
  jobController.getJobs
);

/**
 * @swagger
 * /api/send-message-jobs:
 *   post:
 *     summary: Create a new send message job
 *     tags: [Send Message Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSendMessageJobRequest'
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
 *                   $ref: '#/components/schemas/SendMessageJob'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/',
  authMiddleware.authenticate,
  validationMiddleware.validateBody(createSendMessageJobSchema),
  jobController.createJob
);

/**
 * @swagger
 * /api/send-message-jobs/{id}:
 *   get:
 *     summary: Get send message job by ID
 *     tags: [Send Message Jobs]
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
 *                   $ref: '#/components/schemas/SendMessageJob'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id',
  authMiddleware.authenticate,
  validationMiddleware.validateParams(idParamSchema),
  jobController.getJobById
);

/**
 * @swagger
 * /api/send-message-jobs/{id}/start:
 *   post:
 *     summary: Start a send message job
 *     tags: [Send Message Jobs]
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
router.post('/:id/start',
  authMiddleware.authenticate,
  validationMiddleware.validateParams(idParamSchema),
  jobController.startJob
);

/**
 * @swagger
 * /api/send-message-jobs/{id}/pause:
 *   post:
 *     summary: Pause a send message job
 *     tags: [Send Message Jobs]
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
router.post('/:id/pause',
  authMiddleware.authenticate,
  validationMiddleware.validateParams(idParamSchema),
  jobController.pauseJob
);

/**
 * @swagger
 * /api/send-message-jobs/{id}/resume:
 *   post:
 *     summary: Resume a paused send message job
 *     tags: [Send Message Jobs]
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
router.post('/:id/resume',
  authMiddleware.authenticate,
  validationMiddleware.validateParams(idParamSchema),
  jobController.resumeJob
);

/**
 * @swagger
 * /api/send-message-jobs/{id}/cancel:
 *   post:
 *     summary: Cancel a send message job
 *     tags: [Send Message Jobs]
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
router.post('/:id/cancel',
  authMiddleware.authenticate,
  validationMiddleware.validateParams(idParamSchema),
  jobController.cancelJob
);

/**
 * @swagger
 * /api/send-message-jobs/{id}:
 *   delete:
 *     summary: Delete a send message job
 *     tags: [Send Message Jobs]
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
router.delete('/:id',
  authMiddleware.authenticate,
  validationMiddleware.validateParams(idParamSchema),
  jobController.deleteJob
);

/**
 * @swagger
 * /api/send-message-jobs/stats:
 *   get:
 *     summary: Get send message jobs statistics
 *     tags: [Send Message Jobs]
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
 *                     totalMessages:
 *                       type: number
 *                     successfulMessages:
 *                       type: number
 *                     failedMessages:
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

export default router;
