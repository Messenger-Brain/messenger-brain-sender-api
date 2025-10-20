import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// UserPreference attributes interface
interface UserPreferenceAttributes {
  id: number;
  userId: number;
  systemPreferenceId: number;
  statusId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// UserPreference creation attributes
interface UserPreferenceCreationAttributes extends Optional<UserPreferenceAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// UserPreference model class
class UserPreference extends Model<UserPreferenceAttributes, UserPreferenceCreationAttributes> implements UserPreferenceAttributes {
  public id!: number;
  public userId!: number;
  public systemPreferenceId!: number;
  public statusId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public User?: any;
  public SystemPreference?: any;
  public UserPreferenceStatus?: any;
  public UserPreferenceOptions?: any[];

  // Instance methods
  public override toJSON() {
    return this.get();
  }
}

// Initialize the model
UserPreference.init(
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
    systemPreferenceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'system_preferences',
        key: 'id',
      },
    },
    statusId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user_preferences_status',
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
    tableName: 'user_preferences',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'systemPreferenceId'], // Composite unique index
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['systemPreferenceId'],
      },
      {
        fields: ['statusId'],
      },
    ],
  }
);

export default UserPreference;
