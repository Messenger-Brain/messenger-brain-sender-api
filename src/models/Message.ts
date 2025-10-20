import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// Message attributes interface
interface MessageAttributes {
  id: number;
  remoteJid: string;
  whatsapp_session_id: number;
  message_session_status_id: number;
  sent_at: Date;
  key: any; // JSON data
  message: any; // JSON data
  result?: any; // JSON data
  created_at?: Date;
  updated_at?: Date;
}

// Message creation attributes
interface MessageCreationAttributes extends Optional<MessageAttributes, 'id' | 'result' | 'created_at' | 'updated_at'> {}

// Message model class
class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: number;
  public remoteJid!: string;
  public whatsapp_session_id!: number;
  public message_session_status_id!: number;
  public sent_at!: Date;
  public key!: any;
  public message!: any;
  public result?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public WhatsAppSession?: any;
  public MessageStatus?: any;

  // Instance methods
  public override toJSON() {
    return this.get();
  }
}

// Initialize the model
Message.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    remoteJid: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [10, 50],
      },
    },
    whatsapp_session_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'whatsapp_sessions',
        key: 'id',
      },
    },
    message_session_status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'message_status',
        key: 'id',
      },
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    key: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    message: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    result: {
      type: DataTypes.JSON,
      allowNull: true,
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
    tableName: 'messages',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['whatsapp_session_id'],
      },
      {
        fields: ['message_session_status_id'],
      },
      {
        fields: ['remoteJid'],
      },
      {
        fields: ['sent_at'],
      },
    ],
  }
);

export default Message;
