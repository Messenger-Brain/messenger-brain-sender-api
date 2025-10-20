import { Router } from 'express';
import { UserPreferenceController } from '../controllers/UserPreferenceController';
import { AuthMiddleware } from '../middleware/auth';
import { ValidationMiddleware } from '../middleware/validation';
import { 
  createUserPreferenceSchema, 
  updateUserPreferenceSchema,
  paginationSchema,
  idParamSchema
} from '../schemas/validationSchemas';

const router = Router();
const preferenceController = new UserPreferenceController();
const validationMiddleware = ValidationMiddleware.getInstance();
const authMiddleware = AuthMiddleware.getInstance();

/**
 * @swagger
 * components:
 *   schemas:
 *     UserPreference:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *         userId:
 *           type: number
 *         systemPreferenceId:
 *           type: number
 *         statusId:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         systemPreference:
 *           type: object
 *           properties:
 *             id:
 *               type: number
 *             slug:
 *               type: string
 *             name:
 *               type: string
 *             description:
 *               type: string
 *         options:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: number
 *               slug:
 *                 type: string
 *               value:
 *                 type: string
 *     CreateUserPreferenceRequest:
 *       type: object
 *       required:
 *         - systemPreferenceId
 *         - statusId
 *       properties:
 *         systemPreferenceId:
 *           type: number
 *         statusId:
 *           type: number
 *         options:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - slug
 *               - value
 *             properties:
 *               slug:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               value:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *     UpdateUserPreferenceRequest:
 *       type: object
 *       properties:
 *         statusId:
 *           type: number
 *         options:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - slug
 *               - value
 *             properties:
 *               slug:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               value:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 */

/**
 * @swagger
 * /api/user-preferences:
 *   get:
 *     summary: Get all user preferences with pagination
 *     tags: [User Preferences]
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
 *         name: userId
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: User preferences retrieved successfully
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
 *                     $ref: '#/components/schemas/UserPreference'
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
  preferenceController.getUserPreferences
);

/**
 * @swagger
 * /api/user-preferences:
 *   post:
 *     summary: Create a new user preference
 *     tags: [User Preferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserPreferenceRequest'
 *     responses:
 *       201:
 *         description: User preference created successfully
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
 *                   $ref: '#/components/schemas/UserPreference'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/',
  authMiddleware.authenticate,
  validationMiddleware.validateBody(createUserPreferenceSchema),
  preferenceController.createUserPreference
);

/**
 * @swagger
 * /api/user-preferences/{id}:
 *   get:
 *     summary: Get user preference by ID
 *     tags: [User Preferences]
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
 *         description: User preference retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserPreference'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User preference not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id',
  authMiddleware.authenticate,
  validationMiddleware.validateParams(idParamSchema),
  preferenceController.getUserPreferenceById
);

/**
 * @swagger
 * /api/user-preferences/{id}:
 *   put:
 *     summary: Update user preference by ID
 *     tags: [User Preferences]
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
 *             $ref: '#/components/schemas/UpdateUserPreferenceRequest'
 *     responses:
 *       200:
 *         description: User preference updated successfully
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
 *                   $ref: '#/components/schemas/UserPreference'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User preference not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id',
  authMiddleware.authenticate,
  validationMiddleware.validateParams(idParamSchema),
  validationMiddleware.validateBody(updateUserPreferenceSchema),
  preferenceController.updateUserPreference
);

/**
 * @swagger
 * /api/user-preferences/{id}:
 *   delete:
 *     summary: Delete user preference by ID
 *     tags: [User Preferences]
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
 *         description: User preference deleted successfully
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
 *         description: User preference not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id',
  authMiddleware.authenticate,
  validationMiddleware.validateParams(idParamSchema),
  preferenceController.deleteUserPreference
);

/**
 * @swagger
 * /api/user-preferences/system-preferences:
 *   get:
 *     summary: Get all system preferences
 *     tags: [User Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System preferences retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                       slug:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/system-preferences',
  authMiddleware.authenticate,
  preferenceController.getSystemPreferences
);

/**
 * @swagger
 * /api/user-preferences/statuses:
 *   get:
 *     summary: Get all user preference statuses
 *     tags: [User Preferences]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User preference statuses retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                       slug:
 *                         type: string
 *                       description:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/statuses',
  authMiddleware.authenticate,
  preferenceController.getUserPreferenceStatuses
);

export default router;
