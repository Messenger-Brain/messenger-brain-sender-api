import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// BrowserContext attributes interface
interface BrowserContextAttributes {
  id: number;
  statusId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// BrowserContext creation attributes
interface BrowserContextCreationAttributes extends Optional<BrowserContextAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// BrowserContext model class
class BrowserContext extends Model<BrowserContextAttributes, BrowserContextCreationAttributes> implements BrowserContextAttributes {
  public id!: number;
  public statusId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public BrowserContextStatus?: any;
  public WhatsAppSessions?: any[];

  // Instance methods
  public override toJSON() {
    return this.get();
  }
}

// Initialize the model
BrowserContext.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    statusId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'browser_context_status',
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
    tableName: 'browser_context',
    timestamps: true,
    indexes: [
      {
        fields: ['statusId'],
      },
    ],
  }
);

export default BrowserContext;
