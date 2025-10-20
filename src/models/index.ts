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
    foreignKey: 'statusId',
    as: 'UserStatus',
  });

  UserStatus.hasMany(User, {
    foreignKey: 'statusId',
    as: 'Users',
  });

  // User-Role associations (Many-to-Many)
  User.belongsToMany(Role, {
    through: UserRole,
    foreignKey: 'userId',
    otherKey: 'roleId',
    as: 'Roles',
  });

  Role.belongsToMany(User, {
    through: UserRole,
    foreignKey: 'roleId',
    otherKey: 'userId',
    as: 'Users',
  });

  UserRole.belongsTo(User, {
    foreignKey: 'userId',
    as: 'User',
  });

  UserRole.belongsTo(Role, {
    foreignKey: 'roleId',
    as: 'Role',
  });

  // UserPreference associations
  UserPreference.belongsTo(User, {
    foreignKey: 'userId',
    as: 'User',
  });

  UserPreference.belongsTo(SystemPreference, {
    foreignKey: 'systemPreferenceId',
    as: 'SystemPreference',
  });

  UserPreference.belongsTo(UserPreferenceStatus, {
    foreignKey: 'statusId',
    as: 'UserPreferenceStatus',
  });

  UserPreference.hasMany(UserPreferenceOption, {
    foreignKey: 'userPreferenceId',
    as: 'UserPreferenceOptions',
  });

  UserPreferenceOption.belongsTo(UserPreference, {
    foreignKey: 'userPreferenceId',
    as: 'UserPreference',
  });

  // Token associations
  Token.belongsTo(User, {
    foreignKey: 'userId',
    as: 'User',
  });

  Token.belongsTo(TokenType, {
    foreignKey: 'tokenTypeId',
    as: 'TokenType',
  });

  TokenType.hasMany(Token, {
    foreignKey: 'tokenTypeId',
    as: 'Tokens',
  });

  // Subscription associations
  Subscription.belongsTo(SubscriptionStatus, {
    foreignKey: 'statusId',
    as: 'SubscriptionStatus',
  });

  SubscriptionStatus.hasMany(Subscription, {
    foreignKey: 'statusId',
    as: 'Subscriptions',
  });

  Subscription.hasMany(SubscriptionFeature, {
    foreignKey: 'subscriptionId',
    as: 'SubscriptionFeatures',
  });

  SubscriptionFeature.belongsTo(Subscription, {
    foreignKey: 'subscriptionId',
    as: 'Subscription',
  });

  // UserSubscription associations
  UserSubscription.belongsTo(User, {
    foreignKey: 'userId',
    as: 'User',
  });

  UserSubscription.belongsTo(Subscription, {
    foreignKey: 'subscriptionId',
    as: 'Subscription',
  });

  UserSubscription.belongsTo(UserSubscriptionStatus, {
    foreignKey: 'statusId',
    as: 'UserSubscriptionStatus',
  });

  // UserActivity associations
  UserActivity.belongsTo(User, {
    foreignKey: 'userId',
    as: 'User',
  });

  // WhatsAppSession associations
  WhatsAppSession.belongsTo(User, {
    foreignKey: 'userId',
    as: 'User',
  });

  WhatsAppSession.belongsTo(WhatsAppSessionStatus, {
    foreignKey: 'statusId',
    as: 'WhatsAppSessionStatus',
  });

  WhatsAppSession.belongsTo(BrowserContext, {
    foreignKey: 'browserContextId',
    as: 'BrowserContext',
  });

  BrowserContext.hasMany(WhatsAppSession, {
    foreignKey: 'browserContextId',
    as: 'WhatsAppSessions',
  });

  BrowserContext.belongsTo(BrowserContextStatus, {
    foreignKey: 'statusId',
    as: 'BrowserContextStatus',
  });

  BrowserContextStatus.hasMany(BrowserContext, {
    foreignKey: 'statusId',
    as: 'BrowserContexts',
  });

  // Message associations
  Message.belongsTo(WhatsAppSession, {
    foreignKey: 'whatsappSessionId',
    as: 'WhatsAppSession',
  });

  Message.belongsTo(MessageStatus, {
    foreignKey: 'statusId',
    as: 'MessageStatus',
  });

  MessageStatus.hasMany(Message, {
    foreignKey: 'statusId',
    as: 'Messages',
  });

  // SendMessageJob associations
  SendMessageJob.belongsTo(SendMessageJobStatus, {
    foreignKey: 'statusId',
    as: 'SendMessageJobStatus',
  });

  SendMessageJobStatus.hasMany(SendMessageJob, {
    foreignKey: 'statusId',
    as: 'SendMessageJobs',
  });

  console.log('✅ All model associations configured successfully');
}

export default setupAssociations;
