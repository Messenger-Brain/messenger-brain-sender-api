import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// UserPreference attributes interface
interface UserPreferenceAttributes {
  id: number;
  user_id: number;
  system_preference_id: number;
  status_id: number;
  created_at?: Date;
  updated_at?: Date;
}

// UserPreference creation attributes
interface UserPreferenceCreationAttributes extends Optional<UserPreferenceAttributes, 'id' | 'created_at' | 'updated_at'> {}

// UserPreference model class
class UserPreference extends Model<UserPreferenceAttributes, UserPreferenceCreationAttributes> implements UserPreferenceAttributes {
  public id!: number;
  public user_id!: number;
  public system_preference_id!: number;
  public status_id!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    system_preference_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'system_preferences',
        key: 'id',
      },
    },
    status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user_preferences_status',
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
    tableName: 'user_preferences',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'system_preference_id'], // Composite unique index
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['system_preference_id'],
      },
      {
        fields: ['status_id'],
      },
    ],
  }
);

export default UserPreference;
