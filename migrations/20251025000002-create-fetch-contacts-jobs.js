"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("fetch_contacts_jobs", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      fetch_contacts_jobs_status_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "fetch_contacts_jobs_status",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      whatsapp_session_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "whatsapp_sessions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      log: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("fetch_contacts_jobs");
  },
};
