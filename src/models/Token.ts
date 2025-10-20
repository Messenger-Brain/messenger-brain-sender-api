import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// Token attributes interface
interface TokenAttributes {
  id: number;
  value: string;
  token_type_id: number;
  user_id: number;
  created_at?: Date;
  updated_at?: Date;
}

// Token creation attributes
interface TokenCreationAttributes extends Optional<TokenAttributes, 'id' | 'created_at' | 'updated_at'> {}

// Token model class
class Token extends Model<TokenAttributes, TokenCreationAttributes> implements TokenAttributes {
  public id!: number;
  public value!: string;
  public token_type_id!: number;
  public user_id!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

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
    token_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'token_types',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
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
    tableName: 'tokens',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['value'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['token_type_id'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);

export default Token;
