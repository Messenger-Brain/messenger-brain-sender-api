import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// UserActivity attributes interface
interface UserActivityAttributes {
  id: number;
  user_id: number;
  slug: string;
  description: string;
  created_at?: Date;
  updated_at?: Date;
}

// UserActivity creation attributes
interface UserActivityCreationAttributes extends Optional<UserActivityAttributes, 'id' | 'created_at' | 'updated_at'> {}

// UserActivity model class
class UserActivity extends Model<UserActivityAttributes, UserActivityCreationAttributes> implements UserActivityAttributes {
  public id!: number;
  public user_id!: number;
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
    user_id: {
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
    tableName: 'user_activity',
    timestamps: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['slug'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);

export default UserActivity;
