import { Router } from 'express';
import { SubscriptionController } from '../controllers/SubscriptionController';
import { AuthMiddleware } from '../middleware/auth';
import { ValidationMiddleware } from '../middleware/validation';
import { 
  createSubscriptionSchema, 
  updateSubscriptionSchema,
  paginationSchema,
  idParamSchema,
  createSubscriptionPlanSchema,
  updateSubscriptionPlanSchema
} from '../schemas/validationSchemas';

const router = Router();
const subscriptionController = new SubscriptionController();
const validationMiddleware = ValidationMiddleware.getInstance();
const authMiddleware = AuthMiddleware.getInstance();

/**
 * @swagger
 * components:
 *   schemas:
 *     Subscription:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         active:
 *           type: boolean
 *         daysOfValidity:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     UserSubscription:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *         userId:
 *           type: number
 *         subscriptionId:
 *           type: number
 *         statusId:
 *           type: number
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         subscription:
 *           $ref: '#/components/schemas/Subscription'
 *     CreateSubscriptionRequest:
 *       type: object
 *       required:
 *         - subscriptionId
 *       properties:
 *         subscriptionId:
 *           type: number
 *         receiptImage:
 *           type: object
 *           description: Receipt image file
 *     UpdateSubscriptionRequest:
 *       type: object
 *       properties:
 *         statusId:
 *           type: number
 *         notes:
 *           type: string
 *           maxLength: 1000
 */

/**
 * @swagger
 * /api/subscriptions:
 *   get:
 *     summary: Get all available subscriptions
 *     tags: [Subscriptions]
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
 *         name: active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Subscriptions retrieved successfully
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
 *                     $ref: '#/components/schemas/Subscription'
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
  subscriptionController.getAllSubscriptions
);

/**
 * @swagger
 * /api/subscriptions/{id}:
 *   get:
 *     summary: Get subscription by ID
 *     tags: [Subscriptions]
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
 *         description: Subscription retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Subscription not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id',
  authMiddleware.authenticate,
  validationMiddleware.validateParams(idParamSchema),
  subscriptionController.getSubscriptionById
);

/**
 * @swagger
 * /api/subscriptions/user/{userId}:
 *   get:
 *     summary: Get user's current subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: User subscription retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserSubscription'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User subscription not found
 *       500:
 *         description: Internal server error
 */
router.get('/user/:userId',
  authMiddleware.authenticate,
  subscriptionController.getUserSubscriptions
);

/**
 * @swagger
 * /api/subscriptions:
 *   post:
 *     summary: Create a new user subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - subscriptionId
 *               - receiptImage
 *             properties:
 *               subscriptionId:
 *                 type: number
 *               receiptImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Subscription created successfully
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
 *                   $ref: '#/components/schemas/UserSubscription'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/',
  authMiddleware.authenticate,
  validationMiddleware.validateFile({ required: true, ...require('../schemas/validationSchemas').imageUploadOptions }),
  subscriptionController.createUserSubscription
);

/**
 * @swagger
 * /api/subscriptions/{id}:
 *   put:
 *     summary: Update user subscription status (Admin only)
 *     tags: [Subscriptions]
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
 *             $ref: '#/components/schemas/UpdateSubscriptionRequest'
 *     responses:
 *       200:
 *         description: Subscription updated successfully
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
 *                   $ref: '#/components/schemas/UserSubscription'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Subscription not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id',
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  validationMiddleware.validateParams(idParamSchema),
  validationMiddleware.validateBody(updateSubscriptionSchema),
  subscriptionController.updateUserSubscription
);

/**
 * @swagger
 * /api/subscriptions/check-status:
 *   get:
 *     summary: Check current user's subscription status
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription status checked successfully
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
 *                     hasValidSubscription:
 *                       type: boolean
 *                     subscription:
 *                       $ref: '#/components/schemas/UserSubscription'
 *                     status:
 *                       type: string
 *                     message:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/check-status',
  authMiddleware.authenticate,
  subscriptionController.checkUserSubscriptionStatus
);

/**
 * @swagger
 * /api/subscriptions/stats:
 *   get:
 *     summary: Get subscription statistics (Admin only)
 *     tags: [Subscriptions]
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
 *                     totalSubscriptions:
 *                       type: number
 *                     activeSubscriptions:
 *                       type: number
 *                     expiredSubscriptions:
 *                       type: number
 *                     subscriptionsByPlan:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       500:
 *         description: Internal server error
 */
router.get('/stats',
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  subscriptionController.getUserSubscriptionStats
);

/**
 * @swagger
 * /api/subscriptions/plan:
 *   post:
 *     summary: Create a new subscription plan (Admin only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slug
 *               - description
 *               - statusId
 *               - price
 *             properties:
 *               slug:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 pattern: ^[a-z0-9_-]+$
 *                 description: Unique identifier for the subscription plan (only alphanumeric, underscore and dash)
 *               description:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 500
 *                 description: Description of the subscription plan
 *               statusId:
 *                 type: number
 *                 description: Status ID of the subscription plan (1 for active)
 *               price:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Price of the subscription plan
 *     responses:
 *       201:
 *         description: Subscription plan created successfully
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
 *                   $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: Validation error or subscription plan already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       500:
 *         description: Internal server error
 */
router.post('/plan',
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  validationMiddleware.validateBody(createSubscriptionPlanSchema),
  subscriptionController.createSubscriptionPlan
);

/**
 * @swagger
 * /api/subscriptions/plan/{id}:
 *   put:
 *     summary: Update a subscription plan (Admin only)
 *     tags: [Subscriptions]
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
 *             type: object
 *             properties:
 *               slug:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 pattern: ^[a-z0-9_-]+$
 *                 description: Unique identifier for the subscription plan (only alphanumeric, underscore and dash)
 *               description:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 500
 *                 description: Description of the subscription plan
 *               statusId:
 *                 type: number
 *                 description: Status ID of the subscription plan (1 for active)
 *               price:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Price of the subscription plan
 *     responses:
 *       200:
 *         description: Subscription plan updated successfully
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
 *                   $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Subscription plan not found
 *       500:
 *         description: Internal server error
 */
router.put('/plan/:id',
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  validationMiddleware.validateParams(idParamSchema),
  validationMiddleware.validateBody(updateSubscriptionPlanSchema),
  subscriptionController.updateSubscriptionPlan
);

// Delete subscription plan (Admin only)
/**
 * @swagger
 * /api/subscriptions/plan/{id}:
 *   delete:
 *     summary: Delete a subscription plan (Admin only)
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *         description: ID of the subscription plan to delete
 *     responses:
 *       200:
 *         description: Subscription plan deleted successfully
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
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Subscription plan not found
 *       500:
 *         description: Internal server error
 */
router.delete('/plan/:id',
  authMiddleware.authenticate,
  authMiddleware.requireAdmin,
  validationMiddleware.validateParams(idParamSchema),
  subscriptionController.deleteSubscriptionPlan
);

export default router;
