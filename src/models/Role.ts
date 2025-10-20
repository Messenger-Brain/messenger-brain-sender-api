import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// Role attributes interface
interface RoleAttributes {
  id: number;
  slug: string;
  description: string;
  created_at?: Date;
  updated_at?: Date;
}

// Role creation attributes
interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'created_at' | 'updated_at'> {}

// Role model class
class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  public id!: number;
  public slug!: string;
  public description!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public UserRoles?: any[];

  // Instance methods
  public override toJSON() {
    return this.get();
  }
}

// Initialize the model
Role.init(
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
    tableName: 'roles',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['slug'],
      },
    ],
  }
);

export default Role;
