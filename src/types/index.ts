import { Request } from 'express';

// Express Request extension for user authentication
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        status: string;
        free_trial: boolean;
      };
    }
  }
}

// Authenticated Request interface - using Request with user guaranteed to exist
export type AuthenticatedRequest = Request & {
  user?: {
    id: number;
    email: string;
    role: string;
    status: string;
    free_trial: boolean;
  };
};

// Common API Response types
export interface UserSubscriptionInfo {
  planId: number;
  planName: string;
  status: string;
  expiresAt: Date;
}

export interface FormattedUserResponse {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: Date;
  subscription?: UserSubscriptionInfo;
}

export interface FormattedUserResponseUpdated {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface DatabaseError extends Error {
  code?: string;
  errno?: number;
  sqlState?: string;
  sqlMessage?: string;
}

// JWT Payload interface
export interface JWTPayload {
  id: number;
  email: string;
  role: string;
  status: string;
  iat?: number;
  exp?: number;
}

// Request validation interfaces
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  phone_number: string;
  role:string;
  roleId: number;
  statusId: number;
  freeTrial?: boolean;
  email_verified: boolean;
}


export interface UpdateUserRequestNew {
  name?: string;
  email?: string;
  phone_number?: string;
  role?:string;
  status?:string
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  phone_number?: string;
  roleId?: number;
  statusId?: number;
  freeTrial?: boolean;
  email_verified?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: number;
      name: string;
      email: string;
      phone_number: string;
      role: string;
      status: string;
      free_trial: boolean;
      email_verified: boolean;
    };
    token: string;
    refreshToken?: string;
  };
  error?: string;
}

// Query parameters interfaces
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface FilterQuery {
  search?: string;
  status?: string;
  role?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: number;
  active?: boolean;
}

// WhatsApp Session interfaces
export interface CreateWhatsAppSessionRequest {
  name: string;
  userId: number;
  phoneNumber: string;
  statusId: number;
  accountProtection: boolean;
  logMessages: boolean;
  webhookUrl?: string;
  webhookEnabled: boolean;
  browserContextId?: number;
}

export interface UpdateWhatsAppSessionRequest {
  phoneNumber?: string;
  statusId?: number;
  accountProtection?: boolean;
  logMessages?: boolean;
  webhookUrl?: string;
  webhookEnabled?: boolean;
  browserContextId?: number;
}

// Message interfaces
export interface CreateMessageRequest {
  remoteJid: string;
  whatsappSessionId: number;
  statusId: number;
  sentAt?: Date;
  key: any;
  message: any;
  result?: any;
}

export interface UpdateMessageRequest {
  statusId?: number;
  result?: any;
}

// Job interfaces
export interface CreateSendMessageJobRequest {
  statusId: number;
  log?: any;
}

export interface UpdateSendMessageJobRequest {
  statusId?: number;
  log?: any;
}

// Subscription interfaces
export interface CreateSubscriptionRequest {
  slug: string;
  description: string;
  statusId: number;
  price: number;
}

export interface UpdateSubscriptionRequest {
  slug?: string;
  description?: string;
  statusId?: number;
  price?: number;
}

export interface CreateUserSubscriptionRequest {
  userId: number;
  subscriptionId: number;
  statusId: number;
}

export interface UpdateUserSubscriptionRequest {
  subscriptionId?: number;
  statusId?: number;
}

export interface GetSubscriptionRequestID {
  subscription_id: number;
  subscription_slug: string;
  subscription_status_slug: string;
  expires_at: Date;
}

// Preference interfaces
export interface CreateUserPreferenceRequest {
  userId: number;
  systemPreferenceId: number;
  statusId: number;
}

export interface UpdateUserPreferenceRequest {
  systemPreferenceId?: number;
  statusId?: number;
}

export interface CreateUserPreferenceOptionRequest {
  userPreferenceId: number;
  slug: string;
  value: string;
}

export interface UpdateUserPreferenceOptionRequest {
  slug?: string;
  value?: string;
}

// Token interfaces
export interface CreateTokenRequest {
  value: string;
  tokenTypeId: number;
  userId: number;
}

export interface UpdateTokenRequest {
  value?: string;
  tokenTypeId?: number;
}

// Activity interfaces
export interface CreateUserActivityRequest {
  userId: number;
  slug: string;
  description: string;
}

export interface UpdateUserActivityRequest {
  slug?: string;
  description?: string;
}

// Error interfaces
export interface CreateSystemErrorRequest {
  log: string;
}

export interface UpdateSystemErrorRequest {
  log?: string;
}

// Browser Context interfaces
export interface CreateBrowserContextRequest {
  statusId: number;
}

export interface UpdateBrowserContextRequest {
  statusId?: number;
}

// Status and Role interfaces
export interface CreateStatusRequest {
  slug: string;
  description: string;
}

export interface UpdateStatusRequest {
  slug?: string;
  description?: string;
}

export interface CreateRoleRequest {
  slug: string;
  description: string;
}

export interface UpdateRoleRequest {
  slug?: string;
  description?: string;
}

export interface CreateSystemPreferenceRequest {
  slug: string;
  name: string;
  description: string;
}

export interface UpdateSystemPreferenceRequest {
  slug?: string;
  name?: string;
  description?: string;
}

export interface CreateTokenTypeRequest {
  slug: string;
  description: string;
}

export interface UpdateTokenTypeRequest {
  slug?: string;
  description?: string;
}

export interface CreateSubscriptionFeatureRequest {
  slug: string;
  subscriptionId: number;
  value: string;
}

export interface UpdateSubscriptionFeatureRequest {
  slug?: string;
  subscriptionId?: number;
  value?: string;
}
