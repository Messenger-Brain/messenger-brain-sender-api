'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('whatsapp_sessions', 'name', {
      type: Sequelize.STRING(200),
      allowNull: false,
      after: 'id',
      comment: 'Friendly name for the WhatsApp session'
    });

    // Add index on name for faster searches
    await queryInterface.addIndex('whatsapp_sessions', ['name'], {
      name: 'idx_whatsapp_sessions_name'
    });

    console.log('✅ Added "name" column to whatsapp_sessions table');
  },

  async down(queryInterface, Sequelize) {
    // Remove index first
    await queryInterface.removeIndex('whatsapp_sessions', 'idx_whatsapp_sessions_name');
    
    // Remove column
    await queryInterface.removeColumn('whatsapp_sessions', 'name');
    
    console.log('✅ Removed "name" column from whatsapp_sessions table');
  }
};
