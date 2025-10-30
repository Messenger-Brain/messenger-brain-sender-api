import Joi from "joi";

/**
 * Validation schemas for API requests
 * Simple validation - no country-specific phone validation
 */

// Auth schemas
export const registerSchema = Joi.object({
	name: Joi.string().min(2).max(200).required(),
	email: Joi.string().email().required(),
	password: Joi.string().min(6).required(),
	role: Joi.string().valid("admin", "user", "moderator").optional(),
	roleId: Joi.number().integer().min(1).optional(),
	statusId: Joi.number().integer().min(1).optional(),
	freeTrial: Joi.boolean().optional(),
});

export const loginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required(),
});

export const changePasswordSchema = Joi.object({
	currentPassword: Joi.string().required(),
	newPassword: Joi.string().min(6).required(),
});

export const resetPasswordSchema = Joi.object({
	token: Joi.string().required(),
	newPassword: Joi.string().min(6).required(),
});

export const refreshTokenSchema = Joi.object({
	refreshToken: Joi.string().required(),
});

// User schemas
export const createUserSchema = Joi.object({
	name: Joi.string().min(2).max(200).required(),
	email: Joi.string().email().required(),
	password: Joi.string().min(8).required(),
	phone_number: Joi.string()
		.allow("", null)
		.pattern(/^\+\d+$/)
		.min(8)
		.max(15)
		.optional()
		.messages({
			"string.pattern.base":
				"Phone number must start with + and contain only digits",
			"string.min": "Phone number must be at least {8} characters",
			"string.max": "Phone number must be at most {#15} characters",
		}),
	role: Joi.string().allow("").valid("admin", "user", "moderator").optional(),
	roleId: Joi.number().integer().allow(null).positive().optional(),
	statusId: Joi.number().integer().allow(null).positive().optional(),
});

export const updateUserSchema = Joi.object({
	name: Joi.string().min(2).max(200).optional(),
	email: Joi.string().email().optional(),
	phone_number: Joi.string()
		.allow("", null)
		.pattern(/^\+\d+$/)
		.min(8)
		.max(15)
		.optional()
		.messages({
			"string.pattern.base":
				"Phone number must start with + and contain only digits",
			"string.min": "Phone number must be at least {#limit} characters",
			"string.max": "Phone number must be at most {#limit} characters",
		}),
	statusId: Joi.number().integer().positive().optional(),
	freeTrial: Joi.boolean().optional(),
});

// Profile update schema (for authenticated user updating own profile)
export const updateProfileSchema = Joi.object({
	name: Joi.string().min(2).max(200).optional(),
	phone_number: Joi.string()
		.allow("", null)
		.pattern(/^\+\d+$/)
		.min(8)
		.max(15)
		.optional()
		.messages({
			"string.pattern.base":
				"Phone number must start with + and contain only digits",
			"string.min": "Phone number must be at least {#limit} characters",
			"string.max": "Phone number must be at most {#limit} characters",
		}),
	avatar: Joi.string().uri().max(255).allow("", null).optional().messages({
		"string.uri": "Avatar must be a valid URL",
		"string.max": "Avatar URL must be at most {#limit} characters",
	}),
});

// Confirm delete profile schema (with token from email)
export const confirmDeleteProfileSchema = Joi.object({
	token: Joi.string().required().messages({
		"string.empty": "Token is required",
		"any.required": "Token is required",
	}),
	password: Joi.string().required().messages({
		"string.empty": "Password is required",
		"any.required": "Password is required",
	}),
	confirmation: Joi.string().valid("DELETE").required().messages({
		"any.only": 'Confirmation must be "DELETE"',
		"string.empty": "Confirmation is required",
		"any.required": "Confirmation is required",
	}),
});

export const assignRoleSchema = Joi.object({
	roleId: Joi.number().integer().positive().required(),
});

// WhatsApp Session schemas
export const createWhatsAppSessionSchema = Joi.object({
	name: Joi.string().min(2).max(200).required(),
	phone_number: Joi.string().required(), // Simple validation - just required
	//statusId: Joi.number().integer().min(1).required(),
	accountProtection: Joi.boolean().default(false),
	logMessages: Joi.boolean().default(true),
	webhookUrl: Joi.string().uri().optional(),
	webhookEnabled: Joi.boolean().default(false),
	browserContextId: Joi.number().integer().positive().optional(),
});

export const updateWhatsAppSessionSchema = Joi.object({
	name: Joi.string().min(2).max(200).optional(),
	phoneNumber: Joi.string().optional(), // Simple validation - just optional
	accountProtection: Joi.boolean().optional(),
	logMessages: Joi.boolean().optional(),
	webhookUrl: Joi.string().uri().optional(),
	webhookEnabled: Joi.boolean().optional(),
	browserContextId: Joi.number().integer().positive().optional(),
});

// Message schemas
export const createMessageSchema = Joi.object({
	sessionId: Joi.number().integer().positive().required(),
	phoneNumber: Joi.string().required(), // Simple validation - just required
	message: Joi.string().min(1).max(4096).required(),
	messageType: Joi.string()
		.valid("text", "image", "video", "audio", "document")
		.default("text"),
	mediaUrl: Joi.string().uri().optional(),
	sentAt: Joi.date().optional(),
});

export const bulkMessageSchema = Joi.object({
	sessionId: Joi.number().integer().positive().required(),
	contacts: Joi.array()
		.items(
			Joi.object({
				phoneNumber: Joi.string().required(), // Simple validation - just required
				name: Joi.string().min(1).max(200).required(),
				message: Joi.string().min(1).max(4096).required(),
			})
		)
		.min(1)
		.max(1000)
		.required(),
	delay: Joi.number().integer().min(1000).max(60000).default(2000),
});

// Subscription schemas
export const createSubscriptionSchema = Joi.object({
	subscriptionId: Joi.number().integer().positive().required(),
	receiptImage: Joi.object().required(), // File upload validation handled separately
});

export const updateSubscriptionSchema = Joi.object({
	statusId: Joi.number().integer().positive().required(),
	notes: Joi.string().max(1000).optional(),
});

// Admin subscription schemas
export const createSubscriptionPlanSchema = Joi.object({
	slug: Joi.string()
		.min(2)
		.max(100)
		.pattern(/^[a-z0-9_-]+$/i)
		.required(),
	description: Joi.string().min(5).max(500).required(),
	statusId: Joi.number().integer().positive().required(),
	price: Joi.number().precision(2).min(0).required(),
});

export const updateSubscriptionPlanSchema = Joi.object({
	slug: Joi.string()
		.min(2)
		.max(100)
		.pattern(/^[a-z0-9_-]+$/i)
		.optional(),
	description: Joi.string().min(5).max(500).optional(),
	statusId: Joi.number().integer().positive().optional(),
	price: Joi.number().precision(2).min(0).optional(),
});

// Send Message Job schemas
export const createSendMessageJobSchema = Joi.object({
	sessionId: Joi.number().integer().positive().required(),
	contacts: Joi.array()
		.items(
			Joi.object({
				phoneNumber: Joi.string().required(), // Simple validation - just required
				name: Joi.string().min(1).max(200).required(),
				message: Joi.string().min(1).max(4096).required(),
			})
		)
		.min(1)
		.max(1000)
		.required(),
	delay: Joi.number().integer().min(1000).max(60000).default(2000),
	priority: Joi.number().integer().min(1).max(10).default(5),
});

// Fetch Contacts Job schemas
export const createFetchContactsJobSchema = Joi.object({
	whatsapp_session_id: Joi.number().integer().positive().required(),
	delay: Joi.number().integer().min(1000).max(60000).default(2000),
	priority: Joi.number().integer().min(1).max(10).default(5),
});

// User Preference schemas
export const createUserPreferenceSchema = Joi.object({
	systemPreferenceId: Joi.number().integer().positive().required(),
	statusId: Joi.number().integer().positive().required(),
	options: Joi.array()
		.items(
			Joi.object({
				slug: Joi.string().min(1).max(100).required(),
				value: Joi.string().min(1).max(100).required(),
			})
		)
		.optional(),
});

export const updateUserPreferenceSchema = Joi.object({
	statusId: Joi.number().integer().positive().optional(),
	options: Joi.array()
		.items(
			Joi.object({
				slug: Joi.string().min(1).max(100).required(),
				value: Joi.string().min(1).max(100).required(),
			})
		)
		.optional(),
});

// Query parameter schemas
export const paginationSchema = Joi.object({
	page: Joi.number().integer().min(1).default(1),
	limit: Joi.number().integer().min(1).max(100).default(10),
	search: Joi.string().max(200).optional(),
	sortBy: Joi.string().max(50).optional(),
	sortOrder: Joi.string().valid("ASC", "DESC").default("DESC"),
});

export const userFilterSchema = Joi.object({
	page: Joi.number().integer().min(1).default(1),
	limit: Joi.number().integer().min(1).max(100).default(10),
	search: Joi.string().max(200).optional(),
	roleId: Joi.number().integer().positive().optional(),
	role: Joi.string().valid("admin", "user", "moderator").optional(),
	status: Joi.string().valid("active", "inactive", "suspended").optional(),
	statusId: Joi.number().integer().positive().optional(),
	freeTrial: Joi.boolean().optional(),
	sortBy: Joi.string().valid("createdAt", "name", "email").max(50).optional(),
	sortOrder: Joi.string().valid("ASC", "DESC").default("DESC"),
});

export const sessionFilterSchema = Joi.object({
	page: Joi.number().integer().min(1).default(1),
	limit: Joi.number().integer().min(1).max(100).default(10),
	search: Joi.string().max(200).optional(),
	statusId: Joi.number().integer().positive().optional(),
	userId: Joi.number().integer().positive().optional(),
	sortBy: Joi.string().max(50).optional(),
	sortOrder: Joi.string().valid("ASC", "DESC").default("DESC"),
});

// Parameter schemas
export const idParamSchema = Joi.object({
	id: Joi.number().integer().positive().required(),
});

export const userIdParamSchema = Joi.object({
	userId: Joi.number().integer().positive().required(),
});

export const sessionIdParamSchema = Joi.object({
	sessionId: Joi.number().integer().positive().required(),
});

export const roleIdParamSchema = Joi.object({
	roleId: Joi.number().integer().positive().required(),
});

// File upload schemas
export const fileUploadOptions = {
	maxSize: 10 * 1024 * 1024, // 10MB
	allowedTypes: [
		"image/jpeg",
		"image/png",
		"image/gif",
		"image/webp",
		"application/pdf",
		"text/plain",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"application/vnd.ms-excel",
	],
};

export const imageUploadOptions = {
	maxSize: 5 * 1024 * 1024, // 5MB
	allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
};
