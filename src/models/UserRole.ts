import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// UserRole attributes interface
interface UserRoleAttributes {
  id: number;
  userId: number;
  roleId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// UserRole creation attributes
interface UserRoleCreationAttributes extends Optional<UserRoleAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// UserRole model class
class UserRole extends Model<UserRoleAttributes, UserRoleCreationAttributes> implements UserRoleAttributes {
  public id!: number;
  public userId!: number;
  public roleId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public User?: any;
  public Role?: any;

  // Instance methods
  public override toJSON() {
    return this.get();
  }
}

// Initialize the model
UserRole.init(
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
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roles',
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
    tableName: 'user_roles',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'roleId'], // Composite unique index
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['roleId'],
      },
    ],
  }
);

export default UserRole;
