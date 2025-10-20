import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// UserPreferenceOption attributes interface
interface UserPreferenceOptionAttributes {
  id: number;
  userPreferenceId: number;
  slug: string;
  value: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// UserPreferenceOption creation attributes
interface UserPreferenceOptionCreationAttributes extends Optional<UserPreferenceOptionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// UserPreferenceOption model class
class UserPreferenceOption extends Model<UserPreferenceOptionAttributes, UserPreferenceOptionCreationAttributes> implements UserPreferenceOptionAttributes {
  public id!: number;
  public userPreferenceId!: number;
  public slug!: string;
  public value!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public UserPreference?: any;

  // Instance methods
  public override toJSON() {
    return this.get();
  }
}

// Initialize the model
UserPreferenceOption.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userPreferenceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user_preferences',
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
    value: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
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
    tableName: 'user_preferences_options',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userPreferenceId', 'slug'], // Composite unique index
      },
      {
        fields: ['userPreferenceId'],
      },
    ],
  }
);

export default UserPreferenceOption;
