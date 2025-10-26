import Joi from 'joi';

/**
 * Validation schemas for API requests
 * Simple validation - no country-specific phone validation
 */

// Auth schemas
export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  roleId: Joi.number().integer().min(1).optional(),
  statusId: Joi.number().integer().min(1).optional(),
  freeTrial: Joi.boolean().optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

// User schemas
export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  roleId: Joi.number().integer().positive().required(),
  statusId: Joi.number().integer().positive().required()
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  email: Joi.string().email().optional(),
  statusId: Joi.number().integer().positive().optional(),
  freeTrial: Joi.boolean().optional()
});

export const assignRoleSchema = Joi.object({
  roleId: Joi.number().integer().positive().required()
});

// WhatsApp Session schemas
export const createWhatsAppSessionSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  phoneNumber: Joi.string().required(), // Simple validation - just required
  statusId: Joi.number().integer().min(1).required(),
  accountProtection: Joi.boolean().default(false),
  logMessages: Joi.boolean().default(true),
  webhookUrl: Joi.string().uri().optional(),
  webhookEnabled: Joi.boolean().default(false),
  browserContextId: Joi.number().integer().positive().optional()
});

export const updateWhatsAppSessionSchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  phoneNumber: Joi.string().optional(), // Simple validation - just optional
  accountProtection: Joi.boolean().optional(),
  logMessages: Joi.boolean().optional(),
  webhookUrl: Joi.string().uri().optional(),
  webhookEnabled: Joi.boolean().optional(),
  browserContextId: Joi.number().integer().positive().optional()
});

// Message schemas
export const createMessageSchema = Joi.object({
  sessionId: Joi.number().integer().positive().required(),
  phoneNumber: Joi.string().required(), // Simple validation - just required
  message: Joi.string().min(1).max(4096).required(),
  messageType: Joi.string().valid('text', 'image', 'video', 'audio', 'document').default('text'),
  mediaUrl: Joi.string().uri().optional(),
  sentAt: Joi.date().optional()
});

export const bulkMessageSchema = Joi.object({
  sessionId: Joi.number().integer().positive().required(),
  contacts: Joi.array().items(
    Joi.object({
      phoneNumber: Joi.string().required(), // Simple validation - just required
      name: Joi.string().min(1).max(200).required(),
      message: Joi.string().min(1).max(4096).required()
    })
  ).min(1).max(1000).required(),
  delay: Joi.number().integer().min(1000).max(60000).default(2000)
});

// Subscription schemas
export const createSubscriptionSchema = Joi.object({
  subscriptionId: Joi.number().integer().positive().required(),
  receiptImage: Joi.object().required() // File upload validation handled separately
});

export const updateSubscriptionSchema = Joi.object({
  statusId: Joi.number().integer().positive().required(),
  notes: Joi.string().max(1000).optional()
});

// Send Message Job schemas
export const createSendMessageJobSchema = Joi.object({
  sessionId: Joi.number().integer().positive().required(),
  contacts: Joi.array().items(
    Joi.object({
      phoneNumber: Joi.string().required(), // Simple validation - just required
      name: Joi.string().min(1).max(200).required(),
      message: Joi.string().min(1).max(4096).required()
    })
  ).min(1).max(1000).required(),
  delay: Joi.number().integer().min(1000).max(60000).default(2000),
  priority: Joi.number().integer().min(1).max(10).default(5)
});

// User Preference schemas
export const createUserPreferenceSchema = Joi.object({
  systemPreferenceId: Joi.number().integer().positive().required(),
  statusId: Joi.number().integer().positive().required(),
  options: Joi.array().items(
    Joi.object({
      slug: Joi.string().min(1).max(100).required(),
      value: Joi.string().min(1).max(100).required()
    })
  ).optional()
});

export const updateUserPreferenceSchema = Joi.object({
  statusId: Joi.number().integer().positive().optional(),
  options: Joi.array().items(
    Joi.object({
      slug: Joi.string().min(1).max(100).required(),
      value: Joi.string().min(1).max(100).required()
    })
  ).optional()
});

// Query parameter schemas
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().max(200).optional(),
  sortBy: Joi.string().max(50).optional(),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
});

export const userFilterSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().max(200).optional(),
  roleId: Joi.number().integer().positive().optional(),
  statusId: Joi.number().integer().positive().optional(),
  freeTrial: Joi.boolean().optional(),
  sortBy: Joi.string().max(50).optional(),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
});

export const sessionFilterSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().max(200).optional(),
  statusId: Joi.number().integer().positive().optional(),
  userId: Joi.number().integer().positive().optional(),
  sortBy: Joi.string().max(50).optional(),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
});

// Parameter schemas
export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
});

export const userIdParamSchema = Joi.object({
  userId: Joi.number().integer().positive().required()
});

export const sessionIdParamSchema = Joi.object({
  sessionId: Joi.number().integer().positive().required()
});

export const roleIdParamSchema = Joi.object({
  roleId: Joi.number().integer().positive().required()
});

// File upload schemas
export const fileUploadOptions = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ]
};

export const imageUploadOptions = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
};

// Message Schema
export const createSendMessageSchema = Joi.object({
  to: Joi.string()
    .pattern(/^(?:\+\d{8,15}|[0-9a-zA-Z-]+@[a-zA-Z0-9.]+)$/) // Teléfono E.164 o JID de grupo/canal
    .required()
    .messages({
      'string.pattern.base': 'El campo "to" debe ser un número E.164 o un JID válido'
    }),

  replyTo: Joi.number().integer().optional(),

  // Text content
  text: Joi.string().max(4096).optional(),

  // Media content
  imageUrl: Joi.string().uri().optional(),
  videoUrl: Joi.string().uri().optional(),
  documentUrl: Joi.string().uri().optional(),
  audioUrl: Joi.string().uri().optional(),
  stickerUrl: Joi.string().uri().optional(),

  // Contact object
  contact: Joi.object({
    name: Joi.string().max(200).required(),
    phoneNumber: Joi.string().required()
  }).optional(),

  // Location object
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  }).optional(),

  // Poll object
  poll: Joi.object({
    question: Joi.string().max(255).required(),
    options: Joi.array().items(Joi.string().max(255)).min(2).max(12).required(),
    multiSelect: Joi.boolean().default(false)
  }).optional(),

  // Document-specific field
  fileName: Joi.string().max(255).optional(),

  // Quoted messages
  quoteMessageId: Joi.number().integer().optional()
})
  .custom((value, helpers) => {
    const {
      text,
      imageUrl,
      videoUrl,
      documentUrl,
      audioUrl,
      stickerUrl,
      contact,
      location,
      poll,
    } = value;

    // Tipos de contenido admitidos (solo uno a la vez)
    const contentTypes = [
      { field: 'imageUrl', value: imageUrl },
      { field: 'videoUrl', value: videoUrl },
      { field: 'documentUrl', value: documentUrl },
      { field: 'audioUrl', value: audioUrl },
      { field: 'stickerUrl', value: stickerUrl },
      { field: 'contact', value: contact },
      { field: 'location', value: location },
      { field: 'poll', value: poll }
    ];

    const presentTypes = contentTypes.filter(item => !!item.value);

    // REGLA 1: Al menos un tipo de contenido (text o alguno más)
    if (presentTypes.length === 0 && !text) {
      return helpers.error('any.custom', {
        message: 'Debe proporcionar al menos un tipo de contenido: text, media, contact, location o poll.'
      });
    }

    // REGLA 2: Solo un tipo de contenido multimedia/contacto/ubicación/poll
    if (presentTypes.length > 1) {
      const presentFields = presentTypes.map(i => i.field).join(', ');
      return helpers.error('any.custom', {
        message: `Solo puede enviar un tipo de contenido a la vez. Campos presentes: ${presentFields}`
      });
    }

    // REGLA 3: fileName solo válido si hay documentUrl
    if (value.fileName && !documentUrl) {
      return helpers.error('any.custom', {
        message: 'El campo fileName solo puede usarse cuando se envía documentUrl.'
      });
    }

    return value;
  }, 'Validación personalizada');
