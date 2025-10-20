import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// User attributes interface
interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
  statusId: number;
  freeTrial: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// User creation attributes (optional fields for creation)
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// User model class
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
  public statusId!: number;
  public freeTrial!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations will be defined later
  public UserStatus?: any;
  public UserRoles?: any[];
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
        len: [6, 200],
      },
    },
    statusId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user_statuses',
        key: 'id',
      },
    },
    freeTrial: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        fields: ['statusId'],
      },
      {
        fields: ['freeTrial'],
      },
    ],
  }
);

export default User;
