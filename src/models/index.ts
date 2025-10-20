import User from './User';
import UserStatus from './UserStatus';
import Role from './Role';
import UserRole from './UserRole';
import SystemPreference from './SystemPreference';
import UserPreference from './UserPreference';
import UserPreferenceStatus from './UserPreferenceStatus';
import UserPreferenceOption from './UserPreferenceOption';
import Token from './Token';
import TokenType from './TokenType';
import Subscription from './Subscription';
import SubscriptionStatus from './SubscriptionStatus';
import SubscriptionFeature from './SubscriptionFeature';
import UserSubscription from './UserSubscription';
import UserSubscriptionStatus from './UserSubscriptionStatus';
import UserActivity from './UserActivity';
import WhatsAppSession from './WhatsAppSession';
import WhatsAppSessionStatus from './WhatsAppSessionStatus';
import BrowserContext from './BrowserContext';
import BrowserContextStatus from './BrowserContextStatus';
import Message from './Message';
import MessageStatus from './MessageStatus';
import SendMessageJob from './SendMessageJob';
import SendMessageJobStatus from './SendMessageJobStatus';
import SystemError from './SystemError';

/**
 * Setup all model associations
 * This function should be called after all models are imported
 */
export function setupAssociations(): void {
  // User associations
  User.belongsTo(UserStatus, {
    foreignKey: 'status_id',
    as: 'UserStatus',
  });

  UserStatus.hasMany(User, {
    foreignKey: 'status_id',
    as: 'Users',
  });

  // User-Role associations (Many-to-Many)
  User.belongsToMany(Role, {
    through: UserRole,
    foreignKey: 'user_id',
    otherKey: 'role_id',
    as: 'Roles',
  });

  Role.belongsToMany(User, {
    through: UserRole,
    foreignKey: 'role_id',
    otherKey: 'user_id',
    as: 'Users',
  });

  UserRole.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'User',
  });

  UserRole.belongsTo(Role, {
    foreignKey: 'role_id',
    as: 'Role',
  });

  // UserPreference associations
  UserPreference.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'User',
  });

  UserPreference.belongsTo(SystemPreference, {
    foreignKey: 'system_preference_id',
    as: 'SystemPreference',
  });

  UserPreference.belongsTo(UserPreferenceStatus, {
    foreignKey: 'status_id',
    as: 'UserPreferenceStatus',
  });

  UserPreference.hasMany(UserPreferenceOption, {
    foreignKey: 'user_preferences_id',
    as: 'UserPreferenceOptions',
  });

  UserPreferenceOption.belongsTo(UserPreference, {
    foreignKey: 'user_preferences_id',
    as: 'UserPreference',
  });

  // Token associations
  Token.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'User',
  });

  Token.belongsTo(TokenType, {
    foreignKey: 'token_type_id',
    as: 'TokenType',
  });

  TokenType.hasMany(Token, {
    foreignKey: 'token_type_id',
    as: 'Tokens',
  });

  // Subscription associations
  Subscription.belongsTo(SubscriptionStatus, {
    foreignKey: 'subscription_status_id',
    as: 'SubscriptionStatus',
  });

  SubscriptionStatus.hasMany(Subscription, {
    foreignKey: 'subscription_status_id',
    as: 'Subscriptions',
  });

  Subscription.hasMany(SubscriptionFeature, {
    foreignKey: 'subscription_id',
    as: 'SubscriptionFeatures',
  });

  SubscriptionFeature.belongsTo(Subscription, {
    foreignKey: 'subscription_id',
    as: 'Subscription',
  });

  // UserSubscription associations
  UserSubscription.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'User',
  });

  UserSubscription.belongsTo(Subscription, {
    foreignKey: 'subscription_id',
    as: 'Subscription',
  });

  UserSubscription.belongsTo(UserSubscriptionStatus, {
    foreignKey: 'status_id',
    as: 'UserSubscriptionStatus',
  });

  // UserActivity associations
  UserActivity.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'User',
  });

  // WhatsAppSession associations
  WhatsAppSession.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'User',
  });

  WhatsAppSession.belongsTo(WhatsAppSessionStatus, {
    foreignKey: 'status_id',
    as: 'WhatsAppSessionStatus',
  });

  WhatsAppSession.belongsTo(BrowserContext, {
    foreignKey: 'browser_context_id',
    as: 'BrowserContext',
  });

  BrowserContext.hasMany(WhatsAppSession, {
    foreignKey: 'browser_context_id',
    as: 'WhatsAppSessions',
  });

  BrowserContext.belongsTo(BrowserContextStatus, {
    foreignKey: 'status_id',
    as: 'BrowserContextStatus',
  });

  BrowserContextStatus.hasMany(BrowserContext, {
    foreignKey: 'status_id',
    as: 'BrowserContexts',
  });

  // Message associations
  Message.belongsTo(WhatsAppSession, {
    foreignKey: 'whatsapp_session_id',
    as: 'WhatsAppSession',
  });

  Message.belongsTo(MessageStatus, {
    foreignKey: 'message_session_status_id',
    as: 'MessageStatus',
  });

  MessageStatus.hasMany(Message, {
    foreignKey: 'message_session_status_id',
    as: 'Messages',
  });

  // SendMessageJob associations
  SendMessageJob.belongsTo(SendMessageJobStatus, {
    foreignKey: 'send_messages_jobs_status_id',
    as: 'SendMessageJobStatus',
  });

  SendMessageJobStatus.hasMany(SendMessageJob, {
    foreignKey: 'send_messages_jobs_status_id',
    as: 'SendMessageJobs',
  });

  console.log('✅ All model associations configured successfully');
}

export default setupAssociations;
