import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// WhatsAppSession attributes interface
interface WhatsAppSessionAttributes {
  id: number;
  name: string;
  user_id: number;
  phone_number: string;
  status_id: number;
  account_protection: boolean;
  log_messages: boolean;
  webhook_url?: string;
  webhook_enabled: boolean;
  webhook_events?: string[];
  read_incoming_messages: boolean;
  auto_reject_calls: boolean;
  api_key: string;
  webhook_secret: string;
  browser_context_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

// WhatsAppSession creation attributes
interface WhatsAppSessionCreationAttributes extends Optional<WhatsAppSessionAttributes, 'id' | 'webhook_url' | 'webhook_events' | 'browser_context_id' | 'created_at' | 'updated_at'> {}

// WhatsAppSession model class
class WhatsAppSession extends Model<WhatsAppSessionAttributes, WhatsAppSessionCreationAttributes> implements WhatsAppSessionAttributes {
  public id!: number;
  public name!: string;
  public user_id!: number;
  public phone_number!: string;
  public status_id!: number;
  public account_protection!: boolean;
  public log_messages!: boolean;
  public webhook_url?: string;
  public webhook_enabled!: boolean;
  public webhook_events?: string[];
  public read_incoming_messages!: boolean;
  public auto_reject_calls!: boolean;
  public api_key!: string;
  public webhook_secret!: string;
  public browser_context_id?: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public User?: any;
  public WhatsAppSessionStatus?: any;
  public BrowserContext?: any;
  public Messages?: any[];

  // Instance methods
  public override toJSON() {
    return this.get();
  }
}

// Initialize the model
WhatsAppSession.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 200],
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [10, 20],
        is: /^\+?[1-9]\d{1,14}$/, // E.164 format
      },
    },
    status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'whatsapp_session_status',
        key: 'id',
      },
    },
    account_protection: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    log_messages: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    webhook_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    webhook_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    webhook_events: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      comment: 'Array of webhook events to subscribe to',
    },
    read_incoming_messages: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Automatically mark incoming messages as read when received',
    },
    auto_reject_calls: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Automatically reject incoming calls',
    },
    api_key: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      comment: 'API key for this WhatsApp session - auto-generated on creation',
    },
    webhook_secret: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Secret for webhook validation - auto-generated on creation',
    },
    browser_context_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'browser_context',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'whatsapp_sessions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'phone_number'], // Composite unique index
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['status_id'],
      },
      {
        fields: ['phone_number'],
      },
      {
        fields: ['browser_context_id'],
      },
    ],
  }
);

export default WhatsAppSession;
