import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// WhatsAppSession attributes interface
interface WhatsAppSessionAttributes {
  id: number;
  userId: number;
  phoneNumber: string;
  statusId: number;
  accountProtection: boolean;
  logMessages: boolean;
  webhookUrl?: string;
  webhookEnabled: boolean;
  browserContextId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// WhatsAppSession creation attributes
interface WhatsAppSessionCreationAttributes extends Optional<WhatsAppSessionAttributes, 'id' | 'webhookUrl' | 'browserContextId' | 'createdAt' | 'updatedAt'> {}

// WhatsAppSession model class
class WhatsAppSession extends Model<WhatsAppSessionAttributes, WhatsAppSessionCreationAttributes> implements WhatsAppSessionAttributes {
  public id!: number;
  public userId!: number;
  public phoneNumber!: string;
  public statusId!: number;
  public accountProtection!: boolean;
  public logMessages!: boolean;
  public webhookUrl?: string;
  public webhookEnabled!: boolean;
  public browserContextId?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [10, 20],
        is: /^\+?[1-9]\d{1,14}$/, // E.164 format
      },
    },
    statusId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'whatsapp_sessions_status',
        key: 'id',
      },
    },
    accountProtection: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    logMessages: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    webhookUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    webhookEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    browserContextId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'browser_context',
        key: 'id',
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'whatsapp_sessions',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'phoneNumber'], // Composite unique index
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['statusId'],
      },
      {
        fields: ['phoneNumber'],
      },
      {
        fields: ['browserContextId'],
      },
    ],
  }
);

export default WhatsAppSession;
