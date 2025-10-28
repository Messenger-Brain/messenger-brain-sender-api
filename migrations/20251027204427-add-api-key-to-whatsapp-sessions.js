'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add column 'api_key' to whatsapp_sessions table
     * This column will be used as a unique identifier for each WhatsApp session,
     * allowing Messenger Brain Sender (external service) to identify sessions securely.
     */
    await queryInterface.addColumn('whatsapp_sessions', 'api_key', {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: true,
      after: 'id' // Optional: defines column order after 'id'
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Remove column 'api_key' in case this migration is reverted.
     */
    await queryInterface.removeColumn('whatsapp_sessions', 'api_key');
  }
};
