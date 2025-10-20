import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// SendMessageJob attributes interface
interface SendMessageJobAttributes {
  id: number;
  send_messages_jobs_status_id: number;
  log?: any; // JSON data
  created_at?: Date;
  updated_at?: Date;
}

// SendMessageJob creation attributes
interface SendMessageJobCreationAttributes extends Optional<SendMessageJobAttributes, 'id' | 'log' | 'created_at' | 'updated_at'> {}

// SendMessageJob model class
class SendMessageJob extends Model<SendMessageJobAttributes, SendMessageJobCreationAttributes> implements SendMessageJobAttributes {
  public id!: number;
  public send_messages_jobs_status_id!: number;
  public log?: any;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

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
    send_messages_jobs_status_id: {
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
    tableName: 'send_messages_jobs',
    timestamps: true,
    indexes: [
      {
        fields: ['send_messages_jobs_status_id'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);

export default SendMessageJob;
