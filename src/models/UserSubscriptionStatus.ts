import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// UserSubscriptionStatus attributes interface
interface UserSubscriptionStatusAttributes {
  id: number;
  slug: string;
  description: string;
  created_at?: Date;
  updated_at?: Date;
}

// UserSubscriptionStatus creation attributes
interface UserSubscriptionStatusCreationAttributes extends Optional<UserSubscriptionStatusAttributes, 'id' | 'created_at' | 'updated_at'> {}

// UserSubscriptionStatus model class
class UserSubscriptionStatus extends Model<UserSubscriptionStatusAttributes, UserSubscriptionStatusCreationAttributes> implements UserSubscriptionStatusAttributes {
  public id!: number;
  public slug!: string;
  public description!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public UserSubscriptions?: any[];

  // Instance methods
  public override toJSON() {
    return this.get();
  }
}

// Initialize the model
UserSubscriptionStatus.init(
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
    tableName: 'user_subscriptions_status',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['slug'],
      },
    ],
  }
);

export default UserSubscriptionStatus;
