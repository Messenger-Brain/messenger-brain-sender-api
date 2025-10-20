import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// MessageStatus attributes interface
interface MessageStatusAttributes {
  id: number;
  slug: string;
  description: string;
  created_at?: Date;
  updated_at?: Date;
}

// MessageStatus creation attributes
interface MessageStatusCreationAttributes extends Optional<MessageStatusAttributes, 'id' | 'created_at' | 'updated_at'> {}

// MessageStatus model class
class MessageStatus extends Model<MessageStatusAttributes, MessageStatusCreationAttributes> implements MessageStatusAttributes {
  public id!: number;
  public slug!: string;
  public description!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public Messages?: any[];

  // Instance methods
  public override toJSON() {
    return this.get();
  }
}

// Initialize the model
MessageStatus.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 100],
        is: /^[a-z0-9_-]+$/i,
      },
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [5, 500],
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
    tableName: 'message_status',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['slug'],
      },
    ],
  }
);

export default MessageStatus;
