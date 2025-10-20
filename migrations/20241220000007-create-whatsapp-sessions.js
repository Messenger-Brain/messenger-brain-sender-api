'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('whatsapp_sessions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      phone_number: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      status_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'whatsapp_session_status',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      account_protection: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      log_messages: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      webhook_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      webhook_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      browser_context_id: {
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable('whatsapp_sessions');
  }
};
