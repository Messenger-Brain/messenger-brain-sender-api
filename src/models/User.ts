import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// User attributes interface
interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
  phone_number: string;
  status_id: number;
  free_trial: boolean;
  email_verified: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// User creation attributes (optional fields for creation)
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'updated_at'> {}

// User model class
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
  public phone_number!: string;
  public status_id!: number;
  public free_trial!: boolean;
  public email_verified!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations will be defined later
  public UserStatus?: any;
  public Roles?: any[];
  public Tokens?: any[];
  public UserPreferences?: any[];
  public UserSubscriptions?: any[];
  public UserActivities?: any[];
  public WhatsAppSessions?: any[];
  public Messages?: any[];

  // Instance methods
  public override toJSON() {
    const values = { ...this.get() };
    const { password, ...safeValues } = values;
    return safeValues;
  }

  // Verify password method
  public async verifyPassword(password: string): Promise<boolean> {
    const bcrypt = require('bcryptjs');
    return bcrypt.compare(password, this.password);
  }

  // Hash password method
  public static async hashPassword(password: string): Promise<string> {
    const bcrypt = require('bcryptjs');
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    return bcrypt.hash(password, saltRounds);
  }
}

// Initialize the model
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 200],
      },
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
        len: [5, 100],
      },
    },
    password: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [8, 200],
      },
     },
    phone_number: {
      type: DataTypes.STRING(15),
      allowNull: true,
      validate: {
        phoneNumberFormat(value: string) {
          if (value === null || value === '') {
            return; // Allow null or empty string
          }
          if (!value.match(/^\+\d+$/)) {
            throw new Error('Phone number must start with + and contain only digits');
          }
          if (value.length < 8 || value.length > 15) {
            throw new Error('Phone number must be between 8 and 15 characters');
          }
        }
      }
    },
    status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user_status',
        key: 'id',
      },
    },
    free_trial: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        fields: ['status_id'],
      },
      {
        fields: ['free_trial'],
      },
    ],
  }
);

export default User;
