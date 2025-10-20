import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// SubscriptionStatus attributes interface
interface SubscriptionStatusAttributes {
  id: number;
  slug: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// SubscriptionStatus creation attributes
interface SubscriptionStatusCreationAttributes extends Optional<SubscriptionStatusAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// SubscriptionStatus model class
class SubscriptionStatus extends Model<SubscriptionStatusAttributes, SubscriptionStatusCreationAttributes> implements SubscriptionStatusAttributes {
  public id!: number;
  public slug!: string;
  public description!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public Subscriptions?: any[];

  // Instance methods
  public override toJSON() {
    return this.get();
  }
}

// Initialize the model
SubscriptionStatus.init(
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
    tableName: 'subscriptions_status',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['slug'],
      },
    ],
  }
);

export default SubscriptionStatus;
