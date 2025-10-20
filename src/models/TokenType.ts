import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// TokenType attributes interface
interface TokenTypeAttributes {
  id: number;
  slug: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// TokenType creation attributes
interface TokenTypeCreationAttributes extends Optional<TokenTypeAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// TokenType model class
class TokenType extends Model<TokenTypeAttributes, TokenTypeCreationAttributes> implements TokenTypeAttributes {
  public id!: number;
  public slug!: string;
  public description!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public Tokens?: any[];

  // Instance methods
  public override toJSON() {
    return this.get();
  }
}

// Initialize the model
TokenType.init(
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
    tableName: 'token_types',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['slug'],
      },
    ],
  }
);

export default TokenType;
