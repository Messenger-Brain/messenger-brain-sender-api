'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('user_status', [
      {
        slug: 'active',
        description: 'Usuario activo',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'inactive',
        description: 'Usuario inactivo',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'suspended',
        description: 'Usuario suspendido',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'pending',
        description: 'Usuario pendiente de activación',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user_status', null, {});
  }
};
