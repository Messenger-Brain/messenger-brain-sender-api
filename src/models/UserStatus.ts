import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// UserStatus attributes interface
interface UserStatusAttributes {
  id: number;
  slug: string;
  description: string;
  created_at?: Date;
  updated_at?: Date;
}

// UserStatus creation attributes
interface UserStatusCreationAttributes extends Optional<UserStatusAttributes, 'id' | 'created_at' | 'updated_at'> {}

// UserStatus model class
class UserStatus extends Model<UserStatusAttributes, UserStatusCreationAttributes> implements UserStatusAttributes {
  public id!: number;
  public slug!: string;
  public description!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public Users?: any[];

  // Instance methods
  public override toJSON() {
    return this.get();
  }
}

// Initialize the model
UserStatus.init(
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
        is: /^[a-z0-9_-]+$/i, // Only lowercase letters, numbers, underscores, and hyphens
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
    tableName: 'user_status',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['slug'],
      },
    ],
  }
);

export default UserStatus;
