import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// WhatsAppSessionStatus attributes interface
interface WhatsAppSessionStatusAttributes {
  id: number;
  slug: string;
  description: string;
  created_at?: Date;
  updated_at?: Date;
}

// WhatsAppSessionStatus creation attributes
interface WhatsAppSessionStatusCreationAttributes extends Optional<WhatsAppSessionStatusAttributes, 'id' | 'created_at' | 'updated_at'> {}

// WhatsAppSessionStatus model class
class WhatsAppSessionStatus extends Model<WhatsAppSessionStatusAttributes, WhatsAppSessionStatusCreationAttributes> implements WhatsAppSessionStatusAttributes {
  public id!: number;
  public slug!: string;
  public description!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public WhatsAppSessions?: any[];

  // Instance methods
  public override toJSON() {
    return this.get();
  }
}

// Initialize the model
WhatsAppSessionStatus.init(
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
    tableName: 'whatsapp_sessions_status',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['slug'],
      },
    ],
  }
);

export default WhatsAppSessionStatus;
