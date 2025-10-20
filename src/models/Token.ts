import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// Token attributes interface
interface TokenAttributes {
  id: number;
  value: string;
  tokenTypeId: number;
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Token creation attributes
interface TokenCreationAttributes extends Optional<TokenAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Token model class
class Token extends Model<TokenAttributes, TokenCreationAttributes> implements TokenAttributes {
  public id!: number;
  public value!: string;
  public tokenTypeId!: number;
  public userId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public User?: any;
  public TokenType?: any;

  // Instance methods
  public override toJSON() {
    return this.get();
  }
}

// Initialize the model
Token.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    value: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [10, 500],
      },
    },
    tokenTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'token_types',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
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
    tableName: 'tokens',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['value'],
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['tokenTypeId'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

export default Token;
