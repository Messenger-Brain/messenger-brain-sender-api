import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// BrowserContextStatus attributes interface
interface BrowserContextStatusAttributes {
  id: number;
  slug: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// BrowserContextStatus creation attributes
interface BrowserContextStatusCreationAttributes extends Optional<BrowserContextStatusAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// BrowserContextStatus model class
class BrowserContextStatus extends Model<BrowserContextStatusAttributes, BrowserContextStatusCreationAttributes> implements BrowserContextStatusAttributes {
  public id!: number;
  public slug!: string;
  public description!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public BrowserContexts?: any[];

  // Instance methods
  public override toJSON() {
    return this.get();
  }
}

// Initialize the model
BrowserContextStatus.init(
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
    tableName: 'browser_context_status',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['slug'],
      },
    ],
  }
);

export default BrowserContextStatus;
