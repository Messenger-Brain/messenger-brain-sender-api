import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// SystemError attributes interface
interface SystemErrorAttributes {
  id: number;
  log: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// SystemError creation attributes
interface SystemErrorCreationAttributes extends Optional<SystemErrorAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// SystemError model class
class SystemError extends Model<SystemErrorAttributes, SystemErrorCreationAttributes> implements SystemErrorAttributes {
  public id!: number;
  public log!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public override toJSON() {
    return this.get();
  }
}

// Initialize the model
SystemError.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    log: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
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
    tableName: 'system_errors',
    timestamps: true,
    indexes: [
      {
        fields: ['createdAt'],
      },
    ],
  }
);

export default SystemError;
