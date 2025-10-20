import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// UserRole attributes interface
interface UserRoleAttributes {
  id: number;
  user_id: number;
  role_id: number;
  created_at?: Date;
  updated_at?: Date;
}

// UserRole creation attributes
interface UserRoleCreationAttributes extends Optional<UserRoleAttributes, 'id' | 'created_at' | 'updated_at'> {}

// UserRole model class
class UserRole extends Model<UserRoleAttributes, UserRoleCreationAttributes> implements UserRoleAttributes {
  public id!: number;
  public user_id!: number;
  public role_id!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roles',
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
  },
  {
    sequelize,
    tableName: 'user_roles',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'role_id'], // Composite unique index
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['role_id'],
      },
    ],
  }
);

export default UserRole;
