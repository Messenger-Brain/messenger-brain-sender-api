import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import whatsappSessionRoutes from './whatsappSessionRoutes';
import messageRoutes from './messageRoutes';
import subscriptionRoutes from './subscriptionRoutes';
import sendMessageJobRoutes from './sendMessageJobRoutes';
import userPreferenceRoutes from './userPreferenceRoutes';
import fetchContactsJobRoutes from './fetchContactsJobRoutes';
import contactsRoutes from './contactsRoutes' 
const router = Router();

// Mount all route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/whatsapp-sessions', whatsappSessionRoutes);
router.use('/messages', messageRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/send-message-jobs', sendMessageJobRoutes);
router.use('/fetch-contacts-jobs', fetchContactsJobRoutes);
router.use('/user-preferences', userPreferenceRoutes);
router.use('/contacts', contactsRoutes )

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * @swagger
 * /api:
 *   get:
 *     summary: API information and available endpoints
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API information retrieved successfully
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
 *                     name:
 *                       type: string
 *                     version:
 *                       type: string
 *                     description:
 *                       type: string
 *                     endpoints:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           path:
 *                             type: string
 *                           method:
 *                             type: string
 *                           description:
 *                             type: string
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Messenger Brain Sender API',
    data: {
      name: 'Messenger Brain Sender API',
      version: '1.0.0',
      description: 'API for managing WhatsApp messaging sessions and sending bulk messages',
      endpoints: [
        {
          path: '/api/auth',
          method: 'POST',
          description: 'Authentication endpoints (login, register, logout)'
        },
        {
          path: '/api/users',
          method: 'GET, POST, PUT, DELETE',
          description: 'User management endpoints'
        },
        {
          path: '/api/whatsapp-sessions',
          method: 'GET, POST, PUT, DELETE',
          description: 'WhatsApp session management endpoints'
        },
        {
          path: '/api/messages',
          method: 'GET, POST',
          description: 'Message sending endpoints'
        },
        {
          path: '/api/subscriptions',
          method: 'GET, POST, PUT',
          description: 'Subscription management endpoints'
        },
        {
          path: '/api/send-message-jobs',
          method: 'GET, POST, PUT, DELETE',
          description: 'Bulk message job management endpoints'
        },
        {
          path: '/api/fetch-contacts-jobs',
          method: 'GET, POST, PUT, DELETE',
          description: 'Fetch contacts job management endpoints'
        },
        {
          path: '/api/user-preferences',
          method: 'GET, POST, PUT, DELETE',
          description: 'User preference management endpoints'
        },
        {
          path: '/api/health',
          method: 'GET',
          description: 'Health check endpoint'
        }
      ]
    }
  });
});

export default router;
