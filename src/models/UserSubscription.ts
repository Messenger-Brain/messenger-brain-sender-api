import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// UserSubscription attributes interface
interface UserSubscriptionAttributes {
  id: number;
  user_id: number;
  subscription_id: number;
  status_id: number;
  created_at?: Date;
  updated_at?: Date;
  expires_at?: Date;
}

// UserSubscription creation attributes
interface UserSubscriptionCreationAttributes extends Optional<UserSubscriptionAttributes, 'id' | 'created_at' | 'updated_at'> {}

// UserSubscription model class
class UserSubscription extends Model<UserSubscriptionAttributes, UserSubscriptionCreationAttributes> implements UserSubscriptionAttributes {
  public id!: number;
  public user_id!: number;
  public subscription_id!: number;
  public status_id!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public expiresAt!: Date;

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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    subscription_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'subscriptions',
        key: 'id',
      },
    },
    status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user_subscriptions_status',
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
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'user_subscriptions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'subscription_id'], // Composite unique index
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['subscription_id'],
      },
      {
        fields: ['status_id'],
      },
    ],
  }
);

export default UserSubscription;
