import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// SystemPreference attributes interface
interface SystemPreferenceAttributes {
  id: number;
  slug: string;
  name: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// SystemPreference creation attributes
interface SystemPreferenceCreationAttributes extends Optional<SystemPreferenceAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// SystemPreference model class
class SystemPreference extends Model<SystemPreferenceAttributes, SystemPreferenceCreationAttributes> implements SystemPreferenceAttributes {
  public id!: number;
  public slug!: string;
  public name!: string;
  public description!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public UserPreferences?: any[];

  // Instance methods
  public override toJSON() {
    return this.get();
  }
}

// Initialize the model
SystemPreference.init(
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
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 200],
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
    tableName: 'system_preferences',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['slug'],
      },
    ],
  }
);

export default SystemPreference;
