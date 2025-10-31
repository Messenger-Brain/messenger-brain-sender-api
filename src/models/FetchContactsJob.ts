import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/sequelize";

// FetchContactsJob attributes interface
interface FetchContactsJobAttributes {
  id: number;
  fetch_contacts_jobs_status_id: number;
  whatsapp_session_id: number;
  log?: any; // JSON data
  created_at?: Date;
  updated_at?: Date;
}

// FetchContactsJob creation attributes
interface FetchContactsJobCreationAttributes
  extends Optional<
    FetchContactsJobAttributes,
    "id" | "log" | "created_at" | "updated_at"
  > {}

// FetchContactsJob model class
class FetchContactsJob
  extends Model<FetchContactsJobAttributes, FetchContactsJobCreationAttributes>
  implements FetchContactsJobAttributes
{
  public id!: number;
  public fetch_contacts_jobs_status_id!: number;
  public whatsapp_session_id!: number;
  public log?: any;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public FetchContactsJobStatus?: any;

  // Instance methods
  public override toJSON() {
    return this.get();
  }
}

// Initialize the model
FetchContactsJob.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    fetch_contacts_jobs_status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "fetch_contacts_jobs_status",
        key: "id",
      },
    },
    whatsapp_session_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "whatsapp_sessions",
        key: "id",
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
    tableName: "fetch_contacts_jobs",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["fetch_contacts_jobs_status_id"],
      },
      {
        fields: ["whatsapp_session_id"],
      },
      {
        fields: ["created_at"],
      },
    ],
  }
);

export default FetchContactsJob;
