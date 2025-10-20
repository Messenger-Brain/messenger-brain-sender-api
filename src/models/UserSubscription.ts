import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// UserSubscription attributes interface
interface UserSubscriptionAttributes {
  id: number;
  userId: number;
  subscriptionId: number;
  statusId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// UserSubscription creation attributes
interface UserSubscriptionCreationAttributes extends Optional<UserSubscriptionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// UserSubscription model class
class UserSubscription extends Model<UserSubscriptionAttributes, UserSubscriptionCreationAttributes> implements UserSubscriptionAttributes {
  public id!: number;
  public userId!: number;
  public subscriptionId!: number;
  public statusId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public User?: any;
  public Subscription?: any;
  public UserSubscriptionStatus?: any;

  // Instance methods
  public override toJSON() {
    return this.get();
  }
}

// Initialize the model
UserSubscription.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
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
    statusId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user_subscriptions_status',
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
    tableName: 'user_subscriptions',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'subscriptionId'], // Composite unique index
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['subscriptionId'],
      },
      {
        fields: ['statusId'],
      },
    ],
  }
);

export default UserSubscription;
