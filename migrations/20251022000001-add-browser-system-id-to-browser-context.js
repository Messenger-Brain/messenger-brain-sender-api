'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('browser_context', 'browser_system_id', {
      type: Sequelize.STRING(100),
      allowNull: true,
      unique: true,
      after: 'browser_context_status_id'
    });

    await queryInterface.addIndex('browser_context', ['browser_system_id'], {
      name: 'idx_browser_context_browser_system_id',
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('browser_context', 'idx_browser_context_browser_system_id');
    await queryInterface.removeColumn('browser_context', 'browser_system_id');
  }
};

