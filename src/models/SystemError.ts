import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// SystemError attributes interface
interface SystemErrorAttributes {
  id: number;
  log: string;
  created_at?: Date;
  updated_at?: Date;
}

// SystemError creation attributes
interface SystemErrorCreationAttributes extends Optional<SystemErrorAttributes, 'id' | 'created_at' | 'updated_at'> {}

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
    tableName: 'system_errors',
    timestamps: true,
    indexes: [
      {
        fields: ['created_at'],
      },
    ],
  }
);

export default SystemError;
