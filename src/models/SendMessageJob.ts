import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// SendMessageJob attributes interface
interface SendMessageJobAttributes {
  id: number;
  statusId: number;
  log?: any; // JSON data
  createdAt?: Date;
  updatedAt?: Date;
}

// SendMessageJob creation attributes
interface SendMessageJobCreationAttributes extends Optional<SendMessageJobAttributes, 'id' | 'log' | 'createdAt' | 'updatedAt'> {}

// SendMessageJob model class
class SendMessageJob extends Model<SendMessageJobAttributes, SendMessageJobCreationAttributes> implements SendMessageJobAttributes {
  public id!: number;
  public statusId!: number;
  public log?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public SendMessageJobStatus?: any;

  // Instance methods
  public override toJSON() {
    return this.get();
  }
}

// Initialize the model
SendMessageJob.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    statusId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'send_messages_jobs_status',
        key: 'id',
      },
    },
    log: {
      type: DataTypes.JSON,
      allowNull: true,
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
    tableName: 'send_messages_jobs',
    timestamps: true,
    indexes: [
      {
        fields: ['statusId'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

export default SendMessageJob;
