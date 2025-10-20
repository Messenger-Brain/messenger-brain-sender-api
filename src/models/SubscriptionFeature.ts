import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// SubscriptionFeature attributes interface
interface SubscriptionFeatureAttributes {
  id: number;
  slug: string;
  subscriptionId: number;
  value: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// SubscriptionFeature creation attributes
interface SubscriptionFeatureCreationAttributes extends Optional<SubscriptionFeatureAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// SubscriptionFeature model class
class SubscriptionFeature extends Model<SubscriptionFeatureAttributes, SubscriptionFeatureCreationAttributes> implements SubscriptionFeatureAttributes {
  public id!: number;
  public slug!: string;
  public subscriptionId!: number;
  public value!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public Subscription?: any;

  // Instance methods
  public override toJSON() {
    return this.get();
  }
}

// Initialize the model
SubscriptionFeature.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
        is: /^[a-z0-9_-]+$/i,
      },
    },
    subscriptionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'subscriptions',
        key: 'id',
      },
    },
    value: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 1000],
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
    tableName: 'subscriptions_features',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['subscriptionId', 'slug'], // Composite unique index
      },
      {
        fields: ['subscriptionId'],
      },
    ],
  }
);

export default SubscriptionFeature;
