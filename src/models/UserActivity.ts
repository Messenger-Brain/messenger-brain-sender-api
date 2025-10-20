import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// UserActivity attributes interface
interface UserActivityAttributes {
  id: number;
  userId: number;
  slug: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// UserActivity creation attributes
interface UserActivityCreationAttributes extends Optional<UserActivityAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// UserActivity model class
class UserActivity extends Model<UserActivityAttributes, UserActivityCreationAttributes> implements UserActivityAttributes {
  public id!: number;
  public userId!: number;
  public slug!: string;
  public description!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public User?: any;

  // Instance methods
  public override toJSON() {
    return this.get();
  }
}

// Initialize the model
UserActivity.init(
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
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
        is: /^[a-z0-9_-]+$/i,
      },
    },
    description: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [5, 1000],
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
    tableName: 'user_activity',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['slug'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

export default UserActivity;
