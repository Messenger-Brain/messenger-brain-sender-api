'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('browser_context', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      browser_context_status_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'browser_context_status',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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
    await queryInterface.dropTable('browser_context');
  }
};
