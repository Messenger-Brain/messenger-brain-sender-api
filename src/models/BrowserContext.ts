import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// BrowserContext attributes interface
interface BrowserContextAttributes {
  id: number;
  browser_context_status_id: number;
  browser_system_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

// BrowserContext creation attributes
interface BrowserContextCreationAttributes extends Optional<BrowserContextAttributes, 'id' | 'created_at' | 'updated_at'> {}

// BrowserContext model class
class BrowserContext extends Model<BrowserContextAttributes, BrowserContextCreationAttributes> implements BrowserContextAttributes {
  public id!: number;
  public browser_context_status_id!: number;
  public browser_system_id?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

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
    browser_context_status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'browser_context_status',
        key: 'id',
      },
    },
    browser_system_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
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
    underscored: true,
    indexes: [
      {
        fields: ['browser_context_status_id'],
      },
      {
        fields: ['browser_system_id'],
        unique: true,
      },
    ],
  }
);

export default BrowserContext;
