'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('messages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      remote_jid: {
        type: Sequelize.STRING,
        allowNull: false
      },
      whatsapp_session_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'whatsapp_sessions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      message_session_status_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'message_status',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      key: {
        type: Sequelize.JSON,
        allowNull: true
      },
      message: {
        type: Sequelize.JSON,
        allowNull: true
      },
      result: {
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
    await queryInterface.dropTable('messages');
  }
};
