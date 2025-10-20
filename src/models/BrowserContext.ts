import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// BrowserContext attributes interface
interface BrowserContextAttributes {
  id: number;
  status_id: number;
  created_at?: Date;
  updated_at?: Date;
}

// BrowserContext creation attributes
interface BrowserContextCreationAttributes extends Optional<BrowserContextAttributes, 'id' | 'created_at' | 'updated_at'> {}

// BrowserContext model class
class BrowserContext extends Model<BrowserContextAttributes, BrowserContextCreationAttributes> implements BrowserContextAttributes {
  public id!: number;
  public status_id!: number;
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
    status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'browser_context_status',
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
    tableName: 'browser_context',
    timestamps: true,
    indexes: [
      {
        fields: ['status_id'],
      },
    ],
  }
);

export default BrowserContext;
