import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sequelize';

// FetchContactsJobStatus attributes interface
interface FetchContactsJobStatusAttributes {
  id: number;
  slug: string;
  description: string;
  created_at?: Date;
  updated_at?: Date;
}

// FetchContactsJobStatus creation attributes
interface FetchContactsJobStatusCreationAttributes extends Optional<FetchContactsJobStatusAttributes, 'id' | 'created_at' | 'updated_at'> {}

// FetchContactsJobStatus model class
class FetchContactsJobStatus extends Model<FetchContactsJobStatusAttributes, FetchContactsJobStatusCreationAttributes> implements FetchContactsJobStatusAttributes {
  public id!: number;
  public slug!: string;
  public description!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public FetchContactsJobs?: any[];

  // Instance methods
  public override toJSON() {
    return this.get();
  }
}

// Initialize the model
FetchContactsJobStatus.init(
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
    tableName: 'fetch_contacts_jobs_status',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['slug'],
      },
    ],
  }
);
    
export default FetchContactsJobStatus;
