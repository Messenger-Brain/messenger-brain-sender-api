'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('user_preferences_status', [
      {
        slug: 'enabled',
        description: 'Preferencia habilitada',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'disabled',
        description: 'Preferencia deshabilitada',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'pending',
        description: 'Preferencia pendiente',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user_preferences_status', null, {});
  }
};
