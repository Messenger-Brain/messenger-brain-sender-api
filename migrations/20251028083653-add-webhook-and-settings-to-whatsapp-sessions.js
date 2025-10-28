'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // Add webhook_events as JSON column
    await queryInterface.addColumn('whatsapp_sessions', 'webhook_events', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
      comment: 'Array of webhook events to subscribe to (e.g., messages.received, session.status)'
    });

    // Add read_incoming_messages as BOOLEAN column
    await queryInterface.addColumn('whatsapp_sessions', 'read_incoming_messages', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Automatically mark incoming messages as read when received'
    });

    // Add auto_reject_calls as BOOLEAN column
    await queryInterface.addColumn('whatsapp_sessions', 'auto_reject_calls', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Automatically reject incoming calls'
    });

    // Add api_key as STRING column (NOT NULL, auto-generated on session creation)
    await queryInterface.addColumn('whatsapp_sessions', 'api_key', {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: true,
      comment: 'API key for this WhatsApp session - auto-generated on creation'
    });

    // Add webhook_secret as STRING column (NOT NULL, auto-generated on session creation)
    await queryInterface.addColumn('whatsapp_sessions', 'webhook_secret', {
      type: Sequelize.STRING(255),
      allowNull: false,
      comment: 'Secret for webhook validation - auto-generated on creation'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove columns in reverse order
    await queryInterface.removeColumn('whatsapp_sessions', 'webhook_secret');
    await queryInterface.removeColumn('whatsapp_sessions', 'api_key');
    await queryInterface.removeColumn('whatsapp_sessions', 'auto_reject_calls');
    await queryInterface.removeColumn('whatsapp_sessions', 'read_incoming_messages');
    await queryInterface.removeColumn('whatsapp_sessions', 'webhook_events');
  }
};
