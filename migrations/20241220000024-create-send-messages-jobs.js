'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('send_messages_jobs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      send_messages_jobs_status_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'send_messages_jobs_status',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      log: {
        type: Sequelize.JSON,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('send_messages_jobs');
  }
};
