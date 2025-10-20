import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// Subscription attributes interface
interface SubscriptionAttributes {
  id: number;
  slug: string;
  description: string;
  statusId: number;
  price: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Subscription creation attributes
interface SubscriptionCreationAttributes extends Optional<SubscriptionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Subscription model class
class Subscription extends Model<SubscriptionAttributes, SubscriptionCreationAttributes> implements SubscriptionAttributes {
  public id!: number;
  public slug!: string;
  public description!: string;
  public statusId!: number;
  public price!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public SubscriptionStatus?: any;
  public SubscriptionFeatures?: any[];
  public UserSubscriptions?: any[];

  // Instance methods
  public override toJSON() {
    return this.get();
  }
}

// Initialize the model
Subscription.init(
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
    statusId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'subscriptions_status',
        key: 'id',
      },
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
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
    tableName: 'subscriptions',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['slug'],
      },
      {
        fields: ['statusId'],
      },
      {
        fields: ['price'],
      },
    ],
  }
);

export default Subscription;
